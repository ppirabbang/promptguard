import { analyzePromptScore, analyzeWithDynamicRules } from "./rule-engine";

// 임계치 상수: 위험 등급을 판단하는 기준 점수
const THRESHOLD_CRITICAL: i32 = 10; // 치명적 위험 임계치
const THRESHOLD_HIGH: i32 = 5;      // 높은 위험 임계치
const THRESHOLD_MEDIUM: i32 = 3;    // 중간 위험 임계치

/**
 * 점수를 기반으로 위험 등급 문자열을 반환하는 함수
 * @param score - 분석된 위험 점수 (정수)
 * @returns 위험 등급 문자열: "critical" | "high" | "medium" | "low"
 */
export function getRiskLevel(score: i32): string {
  // 점수가 치명적 임계치 이상이면 "critical" 반환
  if (score >= THRESHOLD_CRITICAL) {
    return "critical";
  }

  // 점수가 높은 위험 임계치 이상이면 "high" 반환
  if (score >= THRESHOLD_HIGH) {
    return "high";
  }

  // 점수가 중간 위험 임계치 이상이면 "medium" 반환
  if (score >= THRESHOLD_MEDIUM) {
    return "medium";
  }

  // 그 외 모든 경우는 "low" 반환 (위험 낮음)
  return "low";
}

/**
 * 프롬프트와 동적 규칙 JSON을 받아 점수, 위험 등급, 차단 여부를 JSON 문자열로 반환하는 함수
 * @param prompt - 분석할 사용자 입력 프롬프트 문자열
 * @param dynamicRulesJson - 동적 규칙이 담긴 JSON 문자열
 * @returns JSON 형식의 문자열: {"score": N, "riskLevel": "...", "blocked": true/false}
 */
export function getScoreAndLevel(prompt: string, dynamicRulesJson: string): string {
  // 동적 규칙을 포함하여 프롬프트를 분석하고 위험 점수를 계산
  const score: i32 = analyzeWithDynamicRules(prompt, dynamicRulesJson);

  // 계산된 점수를 기반으로 위험 등급 문자열을 결정
  const riskLevel: string = getRiskLevel(score);

  // 차단 여부 결정: 위험 등급이 "high" 또는 "critical"인 경우 차단 처리
  const blocked: bool = riskLevel === "high" || riskLevel === "critical";

  // 차단 여부를 JSON에서 사용할 문자열로 변환 ("true" 또는 "false")
  const blockedStr: string = blocked ? "true" : "false";

  // 결과를 JSON 형식의 문자열로 조합하여 반환
  // 예시: {"score": 7, "riskLevel": "high", "blocked": true}
  return (
    '{"score": ' +
    score.toString() +
    ', "riskLevel": "' +
    riskLevel +
    '", "blocked": ' +
    blockedStr +
    "}"
  );
}
