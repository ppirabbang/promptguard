import { BaseRule } from "./rules/base.rule";
import { JailbreakRule } from "./rules/prompt-injection.rule";
import { SystemPromptRule } from "./rules/prompt-injection.rule";
import { ApiKeyRule } from "./rules/prompt-injection.rule";
import { BypassRule } from "./rules/puzzle-attack.rule";
import { NoAuthRule } from "./rules/puzzle-attack.rule";
import { PermissionRule } from "./rules/puzzle-attack.rule";
import { RoleplayRule } from "./rules/puzzle-attack.rule";
import { HypotheticalRule } from "./rules/puzzle-attack.rule";
import { normalizeText, containsPattern } from "./text.normalizer";

// ─────────────────────────────────────────────────────────────────────────────
// 가중치 상수 정의
// 각 위험 수준에 따라 룰이 적중했을 때 누적 점수에 더해지는 값입니다.
// CRITICAL > HIGH > MEDIUM > LOW 순서로 위험도가 높습니다.
// ─────────────────────────────────────────────────────────────────────────────
const WEIGHT_CRITICAL: i32 = 10; // 즉각적인 위험 (예: 시스템 탈옥 시도)
const WEIGHT_HIGH: i32 = 5;      // 높은 위험 (예: 시스템 프롬프트 탈취, API 키 노출 시도)
const WEIGHT_MEDIUM: i32 = 3;    // 중간 위험 (예: 간접적인 우회 시도)
const WEIGHT_LOW: i32 = 1;       // 낮은 위험 (예: 역할극, 가상 시나리오 등)

// ─────────────────────────────────────────────────────────────────────────────
// 기본 룰 배열 빌더
// 애플리케이션이 기본으로 항상 적용하는 정적 룰 목록입니다.
// 새 룰 클래스가 추가될 경우 이 함수에서 등록해야 합니다.
// ─────────────────────────────────────────────────────────────────────────────
function buildDefaultRules(): BaseRule[] {
  return [
    // ── INJECTION 카테고리 ──────────────────────────────────────────────────
    // 프롬프트 인젝션 공격: AI 모델의 동작을 직접적으로 조작하려는 시도
    new JailbreakRule("rule_jailbreak", "INJECTION", WEIGHT_CRITICAL, true),
    new SystemPromptRule("rule_sysprompt", "INJECTION", WEIGHT_HIGH, true),
    new ApiKeyRule("rule_apikey", "INJECTION", WEIGHT_HIGH, true),

    // ── PUZZLE 카테고리 ─────────────────────────────────────────────────────
    // 퍼즐형 우회 공격: 간접적·우회적 방식으로 제약을 벗어나려는 시도
    new BypassRule("rule_bypass", "PUZZLE", WEIGHT_LOW, true),
    new NoAuthRule("rule_noauth", "PUZZLE", WEIGHT_LOW, true),
    new PermissionRule("rule_permission", "PUZZLE", WEIGHT_LOW, true),
    new RoleplayRule("rule_roleplay", "PUZZLE", WEIGHT_LOW, true),
    new HypotheticalRule("rule_hypothetical", "PUZZLE", WEIGHT_LOW, true),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 누적 점수(Cumulative Score) vs 최대 단일 점수(Max-Only) 방식 비교
//
// [누적 점수 방식 - 본 구현에서 채택]
//   - 모든 적중된 룰의 가중치를 더하여 최종 점수를 산출합니다.
//   - 예: INJECTION(10) + PUZZLE(1) + PUZZLE(1) = 12점
//   - 장점: 복합적인 공격 패턴(여러 룰이 동시에 적중)을 더 높은 점수로 표현합니다.
//     단일 룰만 걸리는 단순 시도보다 다중 패턴 시도가 더 위험하다는 현실을 반영합니다.
//   - 단점: 낮은 가중치의 룰이 많이 등록되면 점수가 과도하게 높아질 수 있습니다.
//
// [최대 단일 점수 방식 - 미채택]
//   - 적중된 룰 중 가장 높은 가중치 하나만 최종 점수로 사용합니다.
//   - 예: INJECTION(10) + PUZZLE(1) → 최종 10점 (PUZZLE 무시)
//   - 장점: 구현이 단순하고 점수 상한이 명확합니다.
//   - 단점: 다중 공격 패턴의 위험도를 과소평가하게 됩니다.
//     공격자가 낮은 위험 룰을 여러 번 우회해도 점수에 반영되지 않습니다.
//
// → 결론: 본 엔진은 **누적 점수 방식**을 채택하여 복합 위협을 정확히 탐지합니다.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * analyzePromptScore
 * 정적으로 등록된 기본 룰 세트를 기반으로 프롬프트의 위험 점수를 계산합니다.
 *
 * 동작 흐름:
 *  1. normalizeText()로 입력 프롬프트를 정규화합니다.
 *     (소문자 변환, 특수문자 제거, 공백 정리 등)
 *  2. buildDefaultRules()로 기본 룰 배열을 생성합니다.
 *  3. 각 룰에 대해 isActive() && evaluate() 조건을 확인합니다.
 *  4. 조건을 만족하는 룰의 가중치를 누적합니다.
 *  5. 최종 누적 점수를 반환합니다.
 *
 * @param prompt - 검사할 원본 사용자 입력 문자열
 * @returns 누적 위험 점수 (0 이상의 정수, 높을수록 위험)
 */
export function analyzePromptScore(prompt: string): i32 {
  // 1단계: 텍스트 정규화
  // 대소문자, 특수 유니코드, 반복 공백 등을 통일하여 패턴 매칭 정확도를 높입니다.
  const normalized: string = normalizeText(prompt);

  // 2단계: 기본 룰 목록 로드
  const rules: BaseRule[] = buildDefaultRules();

  // 3단계: 누적 점수 초기화
  let totalScore: i32 = 0;

  // 4단계: 룰 순회 및 누적 점수 계산
  for (let i: i32 = 0; i < rules.length; i++) {
    const rule = rules[i];

    // isActive() = 해당 룰이 현재 활성화 상태인지 확인
    // evaluate() = 정규화된 텍스트가 룰의 패턴과 일치하는지 판단
    if (rule.isActive() && rule.evaluate(normalized)) {
      // 적중된 룰의 가중치를 누적 점수에 더합니다.
      // 누적 방식이므로 여러 룰이 동시에 적중되면 점수가 합산됩니다.
      totalScore += rule.weight;
    }
  }

  // 5단계: 최종 누적 점수 반환
  return totalScore;
}

/**
 * analyzeWithDynamicRules
 * 기본 룰 세트에 관리자가 동적으로 추가한 커스텀 룰을 병합하여 점수를 계산합니다.
 *
 * dynamicRulesJson 형식 (단순 JSON 배열):
 * [
 *   { "id": "custom_1", "category": "INJECTION", "weight": 3, "pattern": "ignore all" },
 *   { "id": "custom_2", "category": "PUZZLE",    "weight": 2, "pattern": "pretend you" }
 * ]
 *
 * 동작 흐름:
 *  1. 기본 룰 점수를 analyzePromptScore()로 먼저 계산합니다.
 *  2. dynamicRulesJson을 파싱하여 추가 룰 목록을 추출합니다.
 *  3. 정규화된 프롬프트에 대해 각 동적 룰의 패턴을 검사합니다.
 *  4. 일치하는 동적 룰의 가중치를 기본 점수에 누적합니다.
 *  5. 최종 병합 점수를 반환합니다.
 *
 * @param prompt           - 검사할 원본 사용자 입력 문자열
 * @param dynamicRulesJson - 관리자가 추가한 커스텀 룰의 JSON 문자열
 * @returns 기본 룰 + 동적 룰을 합산한 누적 위험 점수
 */
export function analyzeWithDynamicRules(prompt: string, dynamicRulesJson: string): i32 {
  // 1단계: 기본 룰 기반 점수 먼저 계산
  // 정적 룰과 동적 룰의 점수를 분리하여 각각 누적한 뒤 합산합니다.
  let totalScore: i32 = analyzePromptScore(prompt);

  // 2단계: 정규화 (동적 룰 패턴 비교에도 동일한 정규화 텍스트 사용)
  const normalized: string = normalizeText(prompt);

  // 3단계: JSON 파싱
  // AssemblyScript는 표준 JSON 파서가 없으므로 직접 문자열을 파싱합니다.
  // 형식: [{"id":"...","category":"...","weight":N,"pattern":"..."},...]
  //
  // 파싱 전략:
  //  - 배열의 각 객체 블록 {}을 찾습니다.
  //  - 각 블록에서 "pattern"과 "weight" 필드를 추출합니다.
  //  - 추출된 패턴이 정규화 텍스트에 포함되어 있으면 가중치를 누적합니다.

  let jsonStr: string = dynamicRulesJson.trim();

  // JSON 배열 형식 유효성 확인 (최소한 [ 와 ] 로 감싸져야 함)
  if (jsonStr.length < 2) {
    return totalScore;
  }
  if (jsonStr.charAt(0) != "[" || jsonStr.charAt(jsonStr.length - 1) != "]") {
    // 유효하지 않은 JSON 형식이면 기본 점수만 반환
    return totalScore;
  }

  // 배열 괄호 제거 후 객체 블록 파싱 시작
  jsonStr = jsonStr.substring(1, jsonStr.length - 1).trim();

  // 각 객체 블록을 { } 단위로 분리하여 순회
  let startIdx: i32 = 0;
  let depth: i32 = 0;
  let inString: bool = false;

  for (let i: i32 = 0; i < jsonStr.length; i++) {
    const ch: string = jsonStr.charAt(i);

    // 문자열 내부 토큰은 구조 파싱에서 제외
    if (ch == '"' && (i == 0 || jsonStr.charAt(i - 1) != "\\")) {
      inString = !inString;
    }

    if (!inString) {
      if (ch == "{") {
        if (depth == 0) {
          startIdx = i; // 새 객체 시작 위치 기록
        }
        depth++;
      } else if (ch == "}") {
        depth--;
        if (depth == 0) {
          // 하나의 완전한 객체 블록 추출
          const block: string = jsonStr.substring(startIdx, i + 1);

          // 객체 블록에서 "pattern" 값 추출
          const pattern: string = extractJsonStringField(block, "pattern");

          // 객체 블록에서 "weight" 값 추출
          const weightStr: string = extractJsonStringField(block, "weight");
          const weight: i32 = weightStr.length > 0 ? i32(parseInt(weightStr)) : 1;

          // 패턴이 존재하고 정규화 텍스트에 포함되어 있으면 가중치 누적
          if (pattern.length > 0 && containsPattern(normalized, normalizeText(pattern))) {
            // 동적 룰이 적중된 경우 해당 가중치를 누적 점수에 더합니다.
            // 기본 룰과 동적 룰이 동일 패턴을 가질 수 있으므로 중복 누적될 수 있습니다.
            // 이는 의도된 동작입니다: 관리자가 강조한 패턴은 더 높은 점수를 가져야 합니다.
            totalScore += weight;
          }
        }
      }
    }
  }

  // 5단계: 기본 룰 + 동적 룰 합산 점수 반환
  return totalScore;
}

// ─────────────────────────────────────────────────────────────────────────────
// 내부 유틸리티 함수
// ─────────────────────────────────────────────────────────────────────────────

/**
 * extractJsonStringField
 * 단순 JSON 객체 문자열에서 특정 키의 값을 추출합니다.
 * 문자열 값과 숫자 값 모두 문자열 형태로 반환합니다.
 *
 * 예:
 *   extractJsonStringField('{"id":"a","weight":3}', "weight") → "3"
 *   extractJsonStringField('{"pattern":"ignore all"}', "pattern") → "ignore all"
 *
 * @param block - 단일 JSON 객체 블록 문자열 (예: {"key":"value",...})
 * @param field - 추출할 필드 이름
 * @returns 필드의 값 문자열, 없으면 빈 문자열
 */
function extractJsonStringField(block: string, field: string): string {
  // 필드 키 검색: "field": 형태로 탐색
  const keyToken: string = '"' + field + '"';
  const keyIdx: i32 = block.indexOf(keyToken);
  if (keyIdx < 0) return "";

  // ':' 위치 탐색
  let colonIdx: i32 = keyIdx + keyToken.length;
  while (colonIdx < block.length && block.charAt(colonIdx) != ":") {
    colonIdx++;
  }
  if (colonIdx >= block.length) return "";

  // ':' 이후 공백 건너뜀
  let valueStart: i32 = colonIdx + 1;
  while (valueStart < block.length && block.charAt(valueStart) == " ") {
    valueStart++;
  }
  if (valueStart >= block.length) return "";

  // 문자열 값인지 숫자 값인지 판별
  if (block.charAt(valueStart) == '"') {
    // 문자열 값: 닫는 따옴표 탐색
    valueStart++; // 여는 따옴표 건너뜀
    let valueEnd: i32 = valueStart;
    while (valueEnd < block.length && block.charAt(valueEnd) != '"') {
      // 이스케이프 문자 처리
      if (block.charAt(valueEnd) == "\\" && valueEnd + 1 < block.length) {
        valueEnd++;
      }
      valueEnd++;
    }
    return block.substring(valueStart, valueEnd);
  } else {
    // 숫자 또는 불리언 값: 구분자(,, }, 공백)까지 추출
    let valueEnd: i32 = valueStart;
    while (
      valueEnd < block.length &&
      block.charAt(valueEnd) != "," &&
      block.charAt(valueEnd) != "}" &&
      block.charAt(valueEnd) != " "
    ) {
      valueEnd++;
    }
    return block.substring(valueStart, valueEnd).trim();
  }
}
