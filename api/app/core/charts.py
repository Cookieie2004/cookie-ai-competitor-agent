"""ECharts option 生成（莫兰迪配色），供后端报告内联图表使用。"""
from __future__ import annotations

from typing import Any, Dict, List

MORANDI = {
    "primary": "#7C9885",
    "sun": "#F4E2B8",
    "info": "#8FA8C0",
    "risk": "#CE9A92",
    "soft": "#A8C0A8",
    "ink": "#3A413C",
    "ink2": "#6B746C",
    "line": "#E3E8E3",
}
SERIES = ["#7C9885", "#E0B775", "#8FA8C0", "#CE9A92", "#A8C0A8", "#C2B59B"]
SENTIMENT = {"pos": "#8AB58A", "neu": "#C9CFC9", "neg": "#CE9A92"}

_BASE_TEXT = {"color": MORANDI["ink2"], "fontFamily": "Inter, Noto Sans SC, sans-serif"}


def _grid() -> Dict[str, Any]:
    return {"left": 48, "right": 24, "top": 48, "bottom": 36, "containLabel": True}


def feature_radar(title: str, dimensions: List[str], series: List[Dict[str, Any]]) -> Dict[str, Any]:
    indicator = [{"name": d, "max": 100} for d in dimensions]
    data = [
        {"value": s["values"], "name": s["name"], "lineStyle": {"color": SERIES[i % len(SERIES)]},
         "itemStyle": {"color": SERIES[i % len(SERIES)]},
         "areaStyle": {"opacity": 0.12}}
        for i, s in enumerate(series)
    ]
    return {
        "title": {"text": title, "left": "center", "textStyle": {"color": MORANDI["ink"], "fontSize": 15}},
        "tooltip": {},
        "legend": {"bottom": 0, "textStyle": _BASE_TEXT},
        "radar": {
            "indicator": indicator,
            "splitLine": {"lineStyle": {"color": MORANDI["line"]}},
            "splitArea": {"areaStyle": {"color": ["#FAFBF9", "#FFFFFF"]}},
            "axisName": {"color": MORANDI["ink2"]},
        },
        "series": [{"type": "radar", "data": data, "symbolSize": 5}],
    }


def pricing_bar(title: str, products: List[str], values: List[float]) -> Dict[str, Any]:
    return {
        "title": {"text": title, "left": "center", "textStyle": {"color": MORANDI["ink"], "fontSize": 15}},
        "tooltip": {"trigger": "axis"},
        "grid": _grid(),
        "xAxis": {"type": "category", "data": products, "axisLine": {"lineStyle": {"color": MORANDI["line"]}},
                  "axisLabel": {"color": MORANDI["ink2"]}},
        "yAxis": {"type": "value", "name": "￥/月", "splitLine": {"lineStyle": {"color": MORANDI["line"]}},
                  "axisLabel": {"color": MORANDI["ink2"]}},
        "series": [{
            "type": "bar", "data": values, "barWidth": "46%",
            "itemStyle": {"color": MORANDI["primary"], "borderRadius": [8, 8, 0, 0]},
        }],
    }


def market_donut(title: str, shares: List[Dict[str, Any]]) -> Dict[str, Any]:
    data = [{"name": s["name"], "value": s["value"],
             "itemStyle": {"color": SERIES[i % len(SERIES)]}} for i, s in enumerate(shares)]
    return {
        "title": {"text": title, "left": "center", "textStyle": {"color": MORANDI["ink"], "fontSize": 15}},
        "tooltip": {"trigger": "item"},
        "legend": {"bottom": 0, "textStyle": _BASE_TEXT},
        "series": [{
            "type": "pie", "radius": ["42%", "68%"], "center": ["50%", "48%"],
            "avoidLabelOverlap": True, "label": {"show": False},
            "data": data,
        }],
    }


def sentiment_donut(title: str, overall: Dict[str, int]) -> Dict[str, Any]:
    label = {"pos": "正面", "neu": "中性", "neg": "负面"}
    data = [{"name": label[k], "value": overall.get(k, 0), "itemStyle": {"color": SENTIMENT[k]}}
            for k in ("pos", "neu", "neg")]
    return {
        "title": {"text": title, "left": "center", "textStyle": {"color": MORANDI["ink"], "fontSize": 15}},
        "tooltip": {"trigger": "item", "formatter": "{b}: {d}%"},
        "legend": {"bottom": 0, "textStyle": _BASE_TEXT},
        "series": [{
            "type": "pie", "radius": ["45%", "70%"], "center": ["50%", "48%"],
            "label": {"show": False}, "data": data,
        }],
    }


def platform_bar(title: str, by_platform: Dict[str, Dict[str, int]]) -> Dict[str, Any]:
    from app.core.sentiment import PLATFORM_ORDER, PLATFORM_LABEL

    plats = [p for p in PLATFORM_ORDER if p in by_platform]
    names = [PLATFORM_LABEL[p] for p in plats]
    totals = [sum(by_platform[p].values()) for p in plats]
    return {
        "title": {"text": title, "left": "center", "textStyle": {"color": MORANDI["ink"], "fontSize": 15}},
        "tooltip": {"trigger": "axis"},
        "grid": _grid(),
        "xAxis": {"type": "value", "splitLine": {"lineStyle": {"color": MORANDI["line"]}},
                  "axisLabel": {"color": MORANDI["ink2"]}},
        "yAxis": {"type": "category", "data": list(reversed(names)),
                  "axisLabel": {"color": MORANDI["ink2"]}, "axisLine": {"lineStyle": {"color": MORANDI["line"]}}},
        "series": [{
            "type": "bar", "data": list(reversed(totals)), "barWidth": "50%",
            "itemStyle": {"color": MORANDI["info"], "borderRadius": [0, 8, 8, 0]},
        }],
    }


def trend_line(title: str, x: List[str], series: List[Dict[str, Any]],
               y_name: str = "") -> Dict[str, Any]:
    """通用多序列折线图：用于发展趋势/时间演进（如版本节奏、热度、营收增速）。"""
    s = []
    for i, ser in enumerate(series):
        color = SERIES[i % len(SERIES)]
        s.append({
            "name": ser["name"], "type": "line", "smooth": True,
            "symbol": "circle", "symbolSize": 6,
            "lineStyle": {"width": 2.5, "color": color},
            "itemStyle": {"color": color},
            "areaStyle": {"opacity": 0.06, "color": color},
            "data": ser["values"],
        })
    return {
        "title": {"text": title, "left": "center", "textStyle": {"color": MORANDI["ink"], "fontSize": 15}},
        "tooltip": {"trigger": "axis"},
        "legend": {"bottom": 0, "textStyle": _BASE_TEXT},
        "grid": _grid(),
        "xAxis": {"type": "category", "boundaryGap": False, "data": x,
                  "axisLabel": {"color": MORANDI["ink2"]}, "axisLine": {"lineStyle": {"color": MORANDI["line"]}}},
        "yAxis": {"type": "value", "name": y_name, "splitLine": {"lineStyle": {"color": MORANDI["line"]}},
                  "axisLabel": {"color": MORANDI["ink2"]}},
        "series": s,
    }


_FORCE_LABEL = {
    "rivalry": "现有竞争激烈度",
    "new_entrants": "新进入者威胁",
    "substitutes": "替代品威胁",
    "buyer_power": "买方议价能力",
    "supplier_power": "供应商议价能力",
}
_FORCE_ORDER = ["rivalry", "new_entrants", "substitutes", "buyer_power", "supplier_power"]


def five_forces_radar(title: str, forces: Dict[str, Any]) -> Dict[str, Any]:
    """波特五力雷达（0-100，越高代表该方向竞争压力越大）。"""
    keys = [k for k in _FORCE_ORDER if isinstance(forces.get(k), (int, float))]
    indicator = [{"name": _FORCE_LABEL[k], "max": 100} for k in keys]
    values = [forces[k] for k in keys]
    return {
        "title": {"text": title, "left": "center", "textStyle": {"color": MORANDI["ink"], "fontSize": 15}},
        "tooltip": {},
        "radar": {
            "indicator": indicator,
            "splitLine": {"lineStyle": {"color": MORANDI["line"]}},
            "splitArea": {"areaStyle": {"color": ["#FAFBF9", "#FFFFFF"]}},
            "axisName": {"color": MORANDI["ink2"], "fontSize": 11},
        },
        "series": [{
            "type": "radar",
            "data": [{"value": values, "name": "竞争压力",
                      "lineStyle": {"color": MORANDI["risk"]},
                      "itemStyle": {"color": MORANDI["risk"]},
                      "areaStyle": {"opacity": 0.18, "color": MORANDI["risk"]}}],
            "symbolSize": 5,
        }],
    }


def growth_bar(title: str, products: List[str], values: List[float], y_name: str = "%") -> Dict[str, Any]:
    """通用增速/对比柱状图（带正负色区分）。"""
    data = [{"value": v,
             "itemStyle": {"color": MORANDI["primary"] if v >= 0 else MORANDI["risk"],
                           "borderRadius": [8, 8, 0, 0] if v >= 0 else [0, 0, 8, 8]}}
            for v in values]
    return {
        "title": {"text": title, "left": "center", "textStyle": {"color": MORANDI["ink"], "fontSize": 15}},
        "tooltip": {"trigger": "axis"},
        "grid": _grid(),
        "xAxis": {"type": "category", "data": products, "axisLine": {"lineStyle": {"color": MORANDI["line"]}},
                  "axisLabel": {"color": MORANDI["ink2"]}},
        "yAxis": {"type": "value", "name": y_name, "splitLine": {"lineStyle": {"color": MORANDI["line"]}},
                  "axisLabel": {"color": MORANDI["ink2"]}},
        "series": [{"type": "bar", "data": data, "barWidth": "46%"}],
    }


def sentiment_timeline(title: str, timeline: List[Dict[str, Any]]) -> Dict[str, Any]:
    dates = [t["date"] for t in timeline]

    def ser(key: str, name: str) -> Dict[str, Any]:
        return {
            "name": name, "type": "line", "stack": "total", "smooth": True,
            "areaStyle": {"opacity": 0.25}, "lineStyle": {"width": 2},
            "itemStyle": {"color": SENTIMENT[key]},
            "data": [t[key] for t in timeline],
        }

    return {
        "title": {"text": title, "left": "center", "textStyle": {"color": MORANDI["ink"], "fontSize": 15}},
        "tooltip": {"trigger": "axis"},
        "legend": {"bottom": 0, "textStyle": _BASE_TEXT},
        "grid": _grid(),
        "xAxis": {"type": "category", "boundaryGap": False, "data": dates,
                  "axisLabel": {"color": MORANDI["ink2"]}, "axisLine": {"lineStyle": {"color": MORANDI["line"]}}},
        "yAxis": {"type": "value", "splitLine": {"lineStyle": {"color": MORANDI["line"]}},
                  "axisLabel": {"color": MORANDI["ink2"]}},
        "series": [ser("pos", "正面"), ser("neu", "中性"), ser("neg", "负面")],
    }
