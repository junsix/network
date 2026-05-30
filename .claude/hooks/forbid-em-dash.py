#!/usr/bin/env python3
"""
PreToolUse hook — Write/Edit/MultiEdit 입력의 em-dash 차단.

정책:
  - ' — '(공백+U+2014+공백) = 산문 내 사용으로 간주, 차단.
  - 단독 '—' (표 빈 셀 등) = 허용.
  - 차단 시 대체안 안내 (콜론·쉼표·줄바꿈).
"""
from __future__ import annotations

import json
import sys

EM_DASH_PATTERN = " — "  # space + U+2014 + space


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    if tool_name not in ("Write", "Edit", "MultiEdit"):
        sys.exit(0)

    tool_input = data.get("tool_input", {}) or {}
    file_path = tool_input.get("file_path", "")

    # 검사 대상 텍스트 추출
    if tool_name == "Write":
        content = tool_input.get("content", "") or ""
    elif tool_name == "Edit":
        content = tool_input.get("new_string", "") or ""
    elif tool_name == "MultiEdit":
        edits = tool_input.get("edits", []) or []
        content = "\n".join((e.get("new_string", "") or "") for e in edits)
    else:
        sys.exit(0)

    if EM_DASH_PATTERN not in content:
        sys.exit(0)

    # 발견 위치 샘플 (최대 3건)
    matches = []
    for i, line in enumerate(content.split("\n"), 1):
        if EM_DASH_PATTERN in line:
            snippet = line.strip()
            if len(snippet) > 100:
                snippet = snippet[:97] + "..."
            matches.append(f"  L{i}: {snippet}")
            if len(matches) >= 3:
                break

    reason = (
        "에-대시(—)는 사이트 정책상 금지된 문자입니다.\n"
        "콜론(:), 쉼표(,), 또는 줄바꿈으로 대체하세요.\n\n"
        f"파일: {file_path or '(unknown)'}\n"
        f"발견 위치:\n" + "\n".join(matches) + "\n\n"
        "비고: 표 빈 셀 같은 단독 '—'는 허용됩니다. "
        "산문 내 ' — '(공백 둘러싸인 형태)만 차단."
    )

    # Claude Code hook 사양: stdout JSON으로 decision 전달
    print(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))
    sys.exit(0)


if __name__ == "__main__":
    main()
