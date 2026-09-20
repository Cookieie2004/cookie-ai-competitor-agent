"""全局配置：从环境变量 / .env 读取，不硬编码密钥（第 16.4 章）。"""
import os
from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# 用绝对路径定位 backend/.env，避免因启动工作目录不同而读不到密钥。
# config.py 位于 backend/app/core/，向上三级即 backend/。
_BACKEND_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
_ENV_FILE = os.path.join(_BACKEND_DIR, ".env")
TASK_MODEL_OPTIONS = {"qwen3.6-plus", "qwen3.6-flash"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore"
    )

    # LLM（当前接入阿里云百炼 Qwen，使用 OpenAI 兼容接口）。
    # 同时接受历史 .env 的 ZHIPU_* 键，避免升级后本地配置失效。
    qwen_api_key: str = Field(
        default="", validation_alias=AliasChoices("QWEN_API_KEY", "ZHIPU_API_KEY")
    )
    # 默认/杂务模型、核心模型、辅助模型与快速模型均可由 .env 配置。
    # 当前部署使用 Qwen3.6 Plus / Flash；intake、澄清等轻任务使用快速模型。
    qwen_model: str = Field(
        default="qwen3.6-flash", validation_alias=AliasChoices("QWEN_MODEL", "ZHIPU_MODEL")
    )
    # 核心章模型（质量最高，10 并发）
    qwen_model_core: str = Field(
        default="qwen3.6-plus", validation_alias=AliasChoices("QWEN_MODEL_CORE", "ZHIPU_MODEL_CORE")
    )
    # 辅助章模型（质量高，10 并发）
    qwen_model_aux: str = Field(
        default="qwen3.6-flash", validation_alias=AliasChoices("QWEN_MODEL_AUX", "ZHIPU_MODEL_AUX")
    )
    # 杂务/快速模型（30 并发，极速，用于澄清/情感分类/单条重写等轻任务）
    qwen_model_fast: str = Field(
        default="qwen3.6-flash", validation_alias=AliasChoices("QWEN_MODEL_FAST", "ZHIPU_MODEL_FAST")
    )
    qwen_base_url: str = Field(
        default="https://your-qwen-compatible-endpoint/v1",
        validation_alias=AliasChoices("QWEN_BASE_URL", "ZHIPU_BASE_URL"),
    )
    # 单次 LLM 调用超时（秒）与自动重试次数，避免请求卡死拖垮整个服务。
    # analyze 等重型 JSON 调用（claims+对比+定价+五力+趋势一次产出）在大 max_tokens
    # 下耗时较长，180s 给足余量；max_retries 设 1，避免超时后再叠加 2 次重试（最坏 3×timeout）。
    llm_timeout: float = 180.0
    llm_max_retries: int = 1

    # 搜索 API（博查 Bocha Web Search：https://open.bocha.cn 获取 key）
    bocha_api_key: str = ""
    bocha_base_url: str = "https://api.bocha.cn/v1"
    # 单次搜索超时（秒）
    search_timeout: float = 30.0
    # 兼容旧字段（已弃用，不再使用）
    serpapi_key: str = ""
    bing_search_key: str = ""

    # 平台采集
    douyin_cookie: str = ""
    xhs_cookie: str = ""
    bilibili_cookie: str = ""

    # 服务
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    frontend_origin: str = "http://localhost:5173"
    enable_demo_fallback: bool = True

    @property
    def llm_configured(self) -> bool:
        return bool(self.qwen_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


def resolve_task_model(model: str | None) -> str | None:
    """Return a supported manual task model, or None for Auto routing."""
    return model if model in TASK_MODEL_OPTIONS else None
