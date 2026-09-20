"""Qwen LLM 客户端封装（通过阿里云百炼 OpenAI 兼容网关）。

- 模型 / APIKEY 走环境变量，不硬编码、不外泄（第 16.4 章）。
- 支持普通 chat 与流式 chat（供思维流 SSE 使用）。
- chat/chat_json/chat_stream 均支持 model 参数覆盖默认模型（多模型并行调度用）。
- 每次 chat() 调用自动记录 trace span（无侵入埋点，见 trace.py）。
- 未配置 key 时抛出明确错误，由上层决定是否走 demo 兜底。
"""
from __future__ import annotations

import json
import re
import time
from typing import Any, Iterator, Optional

from openai import OpenAI

from app.core.config import get_settings
from app.core import trace


class LLMNotConfigured(RuntimeError):
    """未配置 QWEN_API_KEY。"""


_client: OpenAI | None = None

# 进程级 token 计数（供 progress 真实上报）
TOKEN_USAGE = {"total": 0}

# 429 限速退避：遇到服务限流时自动等待并重试。
_RATE_LIMIT_BACKOFFS = [4.0, 8.0, 15.0, 25.0]


def _is_rate_limit(err: Exception) -> bool:
    msg = str(err)
    return "429" in msg or "rate" in msg.lower() or "1302" in msg


def _get_client() -> OpenAI:
    global _client
    settings = get_settings()
    if not settings.qwen_api_key:
        raise LLMNotConfigured(
            "未配置 Qwen API Key，请在 backend/.env 中填写 QWEN_API_KEY。"
        )
    if _client is None:
        _client = OpenAI(
            api_key=settings.qwen_api_key,
            base_url=settings.qwen_base_url,
            timeout=settings.llm_timeout,
            max_retries=settings.llm_max_retries,
        )
    return _client


def _supports_thinking(model: str) -> bool:
    """当前 Qwen 路由不传递 provider-specific thinking 参数。"""
    return False


def _strip_think(text: str) -> str:
    """剥离兼容模型可能内联输出的 <think>...</think> 思考块。"""
    if not text:
        return text
    # 去掉成对 <think>..</think>
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.S)
    # 去掉残留的未闭合 <think> 开头块（截断时常见）
    if "<think>" in cleaned and "</think>" not in cleaned:
        cleaned = cleaned.split("<think>")[0]
    return cleaned.strip()


def chat(
    messages: list[dict],
    temperature: float = 0.6,
    max_tokens: int = 2048,
    model: str | None = None,
    *,
    purpose: str = "",
    evidence_ids: Optional[list] = None,
) -> str:
    """一次性返回完整回复文本。遇 429 自动退避重试。

    Args:
        model: 可选，覆盖配置中的默认模型（用于多模型并行调度）。
        purpose/evidence_ids: 可选，补充到 trace span（便于决策回放）。
    """
    settings = get_settings()
    client = _get_client()
    last_err: Exception | None = None
    use_model = model or settings.qwen_model
    for delay in [0.0] + _RATE_LIMIT_BACKOFFS:
        if delay:
            time.sleep(delay)
        try:
            kwargs = dict(
                model=use_model,
                messages=messages,  # type: ignore[arg-type]
                temperature=temperature,
                max_tokens=max_tokens,
            )
    # 兼容模型的思考模式会显著增加 token 与延迟，默认关闭。
            # 调研流水线追求速度与稳定输出，统一关闭（实测质量仍很高）。
            if _supports_thinking(use_model):
                kwargs["extra_body"] = {"thinking": {"type": "disabled"}}
            t0 = time.perf_counter()
            resp = client.chat.completions.create(**kwargs)
            latency_ms = int((time.perf_counter() - t0) * 1000)
            content = _strip_think(resp.choices[0].message.content or "")
            usage = None
            try:
                usage = resp.usage
                if usage:
                    TOKEN_USAGE["total"] += int(usage.total_tokens or 0)
            except Exception:
                pass
            # 无侵入埋点：记录本次调用的 trace span
            try:
                trace.record_span(
                    model=use_model,
                    messages=messages,
                    response=content,
                    usage=usage,
                    latency_ms=latency_ms,
                    decision=purpose,
                    evidence_ids=evidence_ids,
                )
            except Exception:
                pass
            return content
        except Exception as e:  # noqa: BLE001
            last_err = e
            if not _is_rate_limit(e):
                raise
    assert last_err is not None
    raise last_err


def chat_json(
    messages: list[dict],
    temperature: float = 0.3,
    max_tokens: int = 2048,
    model: str | None = None,
    *,
    purpose: str = "",
) -> Optional[Any]:
    """要求 LLM 输出 JSON，解析为对象；失败返回 None（调用方决定是否重试）。"""
    raw = chat(messages, temperature=temperature, max_tokens=max_tokens,
               model=model, purpose=purpose)
    return _extract_json(raw)


def chat_schema(
    messages: list[dict],
    coerce,
    *,
    temperature: float = 0.3,
    max_tokens: int = 4096,
    model: str | None = None,
    purpose: str = "",
):
    """结构化输出：要求 LLM 输出 JSON，再用 coerce(raw) 容错校验为目标 Schema。

    coerce: Callable[[Any], Any]，把原始解析结果规整成 Schema（丢非法字段/越界）。
    失败返回 coerce(None) 或 None。
    """
    raw = chat_json(messages, temperature=temperature, max_tokens=max_tokens,
                    model=model, purpose=purpose)
    try:
        return coerce(raw)
    except Exception:
        return None


def _extract_json(text: str) -> Optional[Any]:
    if not text:
        return None
    # 去掉 ```json 围栏
    fenced = re.search(r"```(?:json)?\s*(.+?)```", text, re.S)
    if fenced:
        text = fenced.group(1)
    # 优先尝试整体解析
    try:
        return json.loads(text)
    except Exception:
        pass
    # 退而求其次：抓第一个 { } 或 [ ]
    for pat in (r"\[.*\]", r"\{.*\}"):
        m = re.search(pat, text, re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                continue
    return None


def chat_stream(
    messages: list[dict],
    temperature: float = 0.6,
    max_tokens: int = 2048,
    model: str | None = None,
) -> Iterator[str]:
    """流式返回文本增量（供思维流逐条 append）。"""
    settings = get_settings()
    client = _get_client()
    use_model = model or settings.qwen_model
    stream = client.chat.completions.create(
        model=use_model,
        messages=messages,  # type: ignore[arg-type]
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
