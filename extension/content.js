// extension/content.js

// 1. 알림창 UI 생성
const alertBox = document.createElement('div');
alertBox.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  background-color: #ff4d4f;
  color: white;
  font-weight: bold;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 2147483647;
  display: none;
  pointer-events: none;
`;
document.body.appendChild(alertBox);

// ChatGPT 텍스트 추출 함수
function getPromptText(target) {
  if (target.value !== undefined) return target.value;
  if (target.textContent !== undefined) return target.textContent;
  return "";
}

// 🚨 핵심: 메시지 전송 시 발생하는 모든 에러를 방어하는 안전한 래퍼 함수
function safeSendMessage(text, callback) {
  try {
    chrome.runtime.sendMessage({ type: "ANALYZE_PROMPT", text: text }, (response) => {
      // 비동기 처리 중 발생하는 크롬 내부 에러 무시
      if (chrome.runtime.lastError) {
        console.warn("[Prompt Guard] 백그라운드 연결 대기 중...");
        return;
      }
      callback(response);
    });
  } catch (error) {
    // Extension context invalidated 에러 완벽 방어
    if (error.message.includes('Extension context invalidated')) {
      alertBox.innerText = "🔄 익스텐션 코드가 업데이트되었습니다. F5를 눌러 새로고침 해주세요!";
      alertBox.style.backgroundColor = '#faad14'; // 경고용 노란색
      alertBox.style.display = 'block';
    }
  }
}


let debounceTimer;

// 2. 타이핑 중 실시간 검사
document.body.addEventListener('keyup', (e) => {
  const promptBox = document.querySelector('#prompt-textarea');
  if (!promptBox) return; 

  if (promptBox.contains(e.target) || e.target === promptBox) {
    const text = getPromptText(promptBox);
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!text.trim()) {
        alertBox.style.display = 'none';
        return;
      }

      // 안전한 래퍼 함수 사용
      safeSendMessage(text, (response) => {
        if (response && response.status === "success") {
          if (response.riskLevel === "high" || response.riskLevel === "medium") {
            alertBox.innerText = "🚨 [경고] 사내 정책 위반 단어 감지됨!";
            alertBox.style.backgroundColor = '#ff4d4f';
            alertBox.style.display = 'block';
          } else {
            alertBox.style.display = 'none';
          }
        }
      });
    }, 400);
  }
});

// 3. 엔터키(전송) 차단
document.body.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    const promptBox = document.querySelector('#prompt-textarea');
    if (!promptBox) return;

    if (promptBox.contains(e.target) || e.target === promptBox) {
      const text = getPromptText(promptBox);
      if (!text.trim()) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // 안전한 래퍼 함수 사용
      safeSendMessage(text, (response) => {
        if (response && response.status === "success") {
          if (response.riskLevel === "high") {
             alertBox.innerText = "⛔ [차단됨] 보안 정책 위반으로 서버 전송을 막았습니다.";
             alertBox.style.backgroundColor = '#ff4d4f';
             alertBox.style.display = 'block';
             promptBox.innerHTML = '<p><br></p>';
          } else {
             alertBox.style.display = 'none';
             const sendBtn = document.querySelector('button[data-testid="send-button"]');
             if (sendBtn) sendBtn.click();
          }
        }
      });
    }
  }
}, true);