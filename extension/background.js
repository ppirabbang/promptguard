// extension/background.js 최상단 부분
import { instantiate } from './build/release.js';

let analyzePrompt = null;
let wasmModule = null;

async function loadWasmEngine() {
  try {
    const response = await fetch(chrome.runtime.getURL('build/release.wasm'));
    const buffer = await response.arrayBuffer();
    
    // 🚨 핵심 해결책: 버퍼를 그냥 넣지 않고 WebAssembly 모듈로 사전 '컴파일' 합니다.
    const compiledModule = await WebAssembly.compile(buffer);
    
    // 컴파일된 모듈을 넣어서 조립하면 메모리(memory) undefined 에러가 발생하지 않습니다.
    wasmModule = await instantiate(compiledModule, {
      env: {
        abort: () => console.error("Wasm aborted")
      }
    });
    
    analyzePrompt = wasmModule.analyzePrompt || wasmModule.exports.analyzePrompt;
    
    console.log("✅ [Wasm Engine] 로컬 메모리에 완벽히 적재되었습니다!");
  } catch (error) {
    console.error("❌ [Wasm Engine] 로드 에러:", error);
  }
}

loadWasmEngine();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ANALYZE_PROMPT") {
    if (!analyzePrompt) {
      sendResponse({ status: "error", message: "Wasm 엔진 로딩 중입니다." });
      return true;
    }

    try {
      // 자바스크립트 문자열을 Wasm 메모리에 할당 (AssemblyScript 바인딩 활용)
      const { __newString } = wasmModule.exports || wasmModule;
      
      let score = 1; // 기본값 (안전)
      
      // 문자열을 Wasm 포인터로 변환하여 넘겨주기 (안전한 실행을 위해 구조 보강)
      if (__newString) {
        const textPtr = __newString(request.text);
        score = analyzePrompt(textPtr);
      } else {
        score = analyzePrompt(request.text);
      }
      
      let riskLevel = "low";
      if (score === 3) riskLevel = "high";
      if (score === 2) riskLevel = "medium";

      sendResponse({ status: "success", riskLevel: riskLevel });
    } catch (error) {
      console.error("분석 중 에러:", error);
      sendResponse({ status: "error", message: error.toString() });
    }
  }
  return true; 
});