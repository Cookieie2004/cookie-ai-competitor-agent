"""48 专家数据加载（前后端共用同一份 experts.json）。"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Optional

_DATA = Path(__file__).parent / "experts.json"


@lru_cache
def load_experts() -> list[dict]:
    with open(_DATA, "r", encoding="utf-8") as f:
        return json.load(f)


def expert_by_id(eid: str) -> Optional[dict]:
    for e in load_experts():
        if e["id"] == eid:
            return e
    return None


def experts_by_level(level: str) -> list[dict]:
    return [e for e in load_experts() if e["level"] == level]
