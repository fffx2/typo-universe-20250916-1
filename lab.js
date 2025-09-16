// DOM이 로드되면 실험실 기능 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeLab();
});

// ==================== 실험실 초기화 ====================
function initializeLab() {
    // URL에서 색상 정보 가져오기
    const params = new URLSearchParams(window.location.search);
    const bgColor = params.get('bg');
    const textColor = params.get('text');

    const bgColorInput = document.getElementById('bg-color-input');
    const bgColorPicker = document.getElementById('bg-color-picker');
    const textColorInput = document.getElementById('text-color-input');
    const textColorPicker = document.getElementById('text-color-picker');
    const lineHeightInput = document.getElementById('line-height-input');
    const fontSizeInput = document.getElementById('font-size-input');

    // URL에 색상 정보가 있으면 적용
    if (bgColor) {
        bgColorInput.value = bgColor;
        bgColorPicker.value = bgColor;
    }
    if (textColor) {
        textColorInput.value = textColor;
        textColorPicker.value = textColor;
    }

    // 초기 대비율 계산
    updateContrast();
    // 초기 폰트 크기 적용
    updateFontSizes();

    // 이벤트 리스너 추가
    bgColorInput.addEventListener('input', updateContrast);
    bgColorPicker.addEventListener('input', () => {
        bgColorInput.value = bgColorPicker.value;
        updateContrast();
    });
    
    textColorInput.addEventListener('input', updateContrast);
    textColorPicker.addEventListener('input', () => {
        textColorInput.value = textColorPicker.value;
        updateContrast();
    });
    
    lineHeightInput.addEventListener('input', () => {
        updateLineHeight(lineHeightInput.value);
    });

    fontSizeInput.addEventListener('input', updateFontSizes);
}

// ==================== 실험실 기능 ====================
// 색상 대비 업데이트
function updateContrast() {
    const bgColor = document.getElementById('bg-color-input').value;
    const textColor = document.getElementById('text-color-input').value;
    
    // 대비율 계산
    const ratio = calculateContrast(bgColor, textColor);
    document.getElementById('contrast-ratio').textContent = ratio.toFixed(2) + ' : 1';
    
    // 미리보기 업데이트
    document.getElementById('large-preview').style.background = bgColor;
    document.getElementById('large-preview').style.color = textColor;
    document.getElementById('small-preview').style.background = bgColor;
    document.getElementById('small-preview').style.color = textColor;
    
    // WCAG 기준 통과 여부 표시
    const aaStatus = document.getElementById('aa-status');
    const aaaStatus = document.getElementById('aaa-status');
    
    aaStatus.classList.toggle('pass', ratio >= 4.5);
    aaStatus.classList.toggle('fail', ratio < 4.5);
    
    aaaStatus.classList.toggle('pass', ratio >= 7);
    aaaStatus.classList.toggle('fail', ratio < 7);
}

// 행간 업데이트
function updateLineHeight(value) {
    document.getElementById('line-height-value').textContent = value;
    document.querySelectorAll('.text-preview').forEach(preview => {
        preview.style.lineHeight = value;
    });
}

// 폰트 크기 업데이트
function updateFontSizes() {
    const size = document.getElementById('font-size-input').value;
    document.getElementById('pt-example').style.fontSize = `${size}pt`;
    document.getElementById('px-example').style.fontSize = `${size}px`;
    document.getElementById('sp-example').style.fontSize = `${size}px`; // sp/dp는 웹에서 px로 근사치 표현
}

// 색상 대비율 계산
function calculateContrast(bg, fg) {
    const bgRgb = hexToRgb(bg);
    const fgRgb = hexToRgb(fg);
    
    if (!bgRgb || !fgRgb) return 1;
    
    const bgLum = luminance(bgRgb);
    const fgLum = luminance(fgRgb);
    
    const lighter = Math.max(bgLum, fgLum);
    const darker = Math.min(bgLum, fgLum);
    
    return (lighter + 0.05) / (darker + 0.05);
}

// HEX를 RGB로 변환
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// 휘도 계산
function luminance(rgb) {
    const { r, g, b } = rgb;
    const sRGB = [r, g, b].map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return sRGB[0] * 0.2126 + sRGB[1] * 0.7152 + sRGB[2] * 0.0722;
}