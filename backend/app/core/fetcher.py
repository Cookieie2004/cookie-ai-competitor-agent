"""真实网页抓取（第 5 章 通用采集）。

- httpx 拉取 HTML → trafilatura 抽正文 → BeautifulSoup 抽图片。
- 失败降级：返回 snippet 占位，trace 标 degraded，绝不抛断流程。
"""
from __future__ import annotations

import datetime as _dt
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import httpx

_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
_TIMEOUT = httpx.Timeout(connect=8, read=20, write=5, pool=5)


def _now() -> str:
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def domain_of(url: str) -> str:
    try:
        return urlparse(url).netloc.lower().replace("www.", "")
    except Exception:
        return ""


def fetch_page(url: str, *, fallback_snippet: str = "") -> Dict[str, Any]:
    """抓取单页正文 + 图片。返回 {text, images, ok, degraded}。"""
    result: Dict[str, Any] = {
        "url": url,
        "text": fallback_snippet,
        "images": [],
        "og_image": "",
        "ok": False,
        "degraded": True,
    }
    try:
        with httpx.Client(
            timeout=_TIMEOUT,
            follow_redirects=True,
            headers={"User-Agent": _UA, "Accept-Language": "zh-CN,zh;q=0.9"},
        ) as client:
            r = client.get(url)
            r.raise_for_status()
            # 编码兜底：httpx 按响应头 charset 解码，遇错误声明会乱码。
            # 若检测到乱码，用 apparent_encoding（chardet/charset_normalizer）重解码。
            html = r.text
            try:
                from app.core.textquality import is_garbled
                if is_garbled(html[:2000]):
                    enc = r.encoding or ""
                    for cand in ("utf-8", "gbk", "gb18030"):
                        if cand.lower() == enc.lower():
                            continue
                        try:
                            redecoded = r.content.decode(cand, errors="strict")
                            if not is_garbled(redecoded[:2000]):
                                html = redecoded
                                break
                        except Exception:
                            continue
            except Exception:
                pass

        text = _extract_text(html) or fallback_snippet
        # 乱码正文丢弃，退回 snippet
        try:
            from app.core.textquality import is_garbled
            if text and is_garbled(text):
                text = fallback_snippet
        except Exception:
            pass
        images = _extract_images(html, url)
        og = _extract_og_image(html, url)
        result.update(
            {"text": text[:4000], "images": images[:6], "og_image": og,
             "ok": True, "degraded": False}
        )
    except Exception:
        # 降级保留 snippet
        pass
    result["captured_at"] = _now()
    return result


def _extract_text(html: str) -> str:
    try:
        import trafilatura

        out = trafilatura.extract(html, include_comments=False, include_tables=False)
        if out:
            return out.strip()
    except Exception:
        pass
    # 退而求其次：BeautifulSoup 抓段落
    try:
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        ps = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
        return "\n".join(p for p in ps if len(p) > 20)
    except Exception:
        return ""


def _extract_images(html: str, base_url: str) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    try:
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src") or ""
            if not src or src.startswith("data:"):
                continue
            if _looks_like_icon(src):
                continue
            full = urljoin(base_url, src)
            alt = (img.get("alt") or "").strip()
            out.append({"src": full, "alt": alt, "source_url": base_url})
            if len(out) >= 8:
                break
    except Exception:
        pass
    return out


def _extract_og_image(html: str, base_url: str) -> str:
    """优先抓取社媒/媒体分享卡片用的 OG/Twitter 预览大图（最具代表性、可溯源）。"""
    try:
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        for prop in (
            ("property", "og:image"),
            ("property", "og:image:url"),
            ("name", "twitter:image"),
            ("name", "twitter:image:src"),
            ("itemprop", "image"),
        ):
            tag = soup.find("meta", attrs={prop[0]: prop[1]})
            if tag and tag.get("content"):
                src = tag["content"].strip()
                if src and not src.startswith("data:"):
                    return urljoin(base_url, src)
        # link rel image_src 兜底
        link = soup.find("link", attrs={"rel": "image_src"})
        if link and link.get("href"):
            return urljoin(base_url, link["href"].strip())
    except Exception:
        pass
    return ""


_ICON_HINTS = ("logo", "icon", "sprite", "avatar", "favicon", "blank", "spacer", "pixel", "1x1")


def _looks_like_icon(src: str) -> bool:
    s = src.lower()
    return any(h in s for h in _ICON_HINTS)
