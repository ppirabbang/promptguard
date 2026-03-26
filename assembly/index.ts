// 위험도 점수 상수
const RISK_LOW: i32 = 1;
const RISK_MEDIUM: i32 = 2;
const RISK_HIGH: i32 = 3;

// 프롬프트를 검사하여 위험도 반환
export function analyzePrompt(prompt: string): i32 {
  // 소문자 변환
  let normalized = prompt.toLowerCase();

  // 1. High Risk (정책 우회, 기밀 유출 시도)
  if (
    normalized.includes("이전 규칙 무시") ||
    normalized.includes("탈옥") ||
    normalized.includes("ignore previous") ||
    normalized.includes("시스템 프롬프트")
  ) {
    return RISK_HIGH;
  }

  // 2. Medium Risk (보안 누락, 개인정보)
  if (
    normalized.includes("인증 없이") ||
    normalized.includes("비밀번호") ||
    normalized.includes("api key")
  ) {
    return RISK_MEDIUM;
  }

  // 3. Low Risk (안전함)
  return RISK_LOW;
}