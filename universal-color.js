// Universal Color System JavaScript
// 색약 시뮬레이션 및 접근성 솔루션 기능

// 전역 상태 관리
let universalColorState = {
    currentBgColor: '#F5F5F5',
    currentTextColor: '#333333',
    currentCbType: 'normal',
    currentPattern: 'stripes',
    patternEnabled: false
};

// DOM이 로드되면 유니버설 컬러 시스템 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeUniversalColorSystem();
});

// 유니버설 컬러 시스템 초기화
function initializeUniversalColorSystem() {
    // 기존 색상 입력 필드와 연동
    syncWithMainColorInputs();
    
    // 색약 유형 선택 이벤트 리스너
    document.querySelectorAll('input[name="cbType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            universalColorState.currentCbType = this.value;
            updateUniversalDisplay();
        });
    });
    
    // 패턴 토글
    const patternToggle = document.getElementById('patternToggle');
    if (patternToggle) {
        patternToggle.addEventListener('change', function() {
            universalColorState.patternEnabled = this.checked;
            const selector = document.getElementById('patternSelector');
            if (this.checked) {
                selector.classList.add('active');
            } else {
                selector.classList.remove('active');
            }
            updateUniversalDisplay();
        });
    }
    
    // 패턴 선택
    document.querySelectorAll('.pattern-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.pattern-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            universalColorState.currentPattern = this.dataset.pattern;
            if (universalColorState.patternEnabled) {
                updateUniversalDisplay();
            }
        });
    });
    
    // 초기 디스플레이 업데이트
    updateUniversalDisplay();
}

// 메인 색상 입력과 동기화
function syncWithMainColorInputs() {
    const bgColorInput = document.getElementById('bg-color-input');
    const textColorInput = document.getElementById('text-color-input');
    
    if (bgColorInput && textColorInput) {
        // 초기값 설정
        universalColorState.currentBgColor = bgColorInput.value;
        universalColorState.currentTextColor = textColorInput.value;
        
        // 색상 변경 감지
        bgColorInput.addEventListener('input', function() {
            universalColorState.currentBgColor = this.value;
            updateUniversalDisplay();
        });
        
        textColorInput.addEventListener('input', function() {
            universalColorState.currentTextColor = this.value;
            updateUniversalDisplay();
        });
        
        // 색상 피커 변경 감지
        const bgPicker = document.getElementById('bg-color-picker');
        const textPicker = document.getElementById('text-color-picker');
        
        if (bgPicker) {
            bgPicker.addEventListener('input', function() {
                universalColorState.currentBgColor = this.value;
                updateUniversalDisplay();
            });
        }
        
        if (textPicker) {
            textPicker.addEventListener('input', function() {
                universalColorState.currentTextColor = this.value;
                updateUniversalDisplay();
            });
        }
    }
}

// 색약 시뮬레이션 매트릭스
const colorBlindnessMatrices = {
    normal: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ],
    protanopia: [ // 적색맹
        [0.567, 0.433, 0],
        [0.558, 0.442, 0],
        [0, 0.242, 0.758]
    ],
    deuteranopia: [ // 녹색맹
        [0.625, 0.375, 0],
        [0.7, 0.3, 0],
        [0, 0.3, 0.7]
    ],
    tritanopia: [ // 청색맹
        [0.95, 0.05, 0],
        [0, 0.433, 0.567],
        [0, 0.475, 0.525]
    ],
    achromatopsia: [ // 전색맹
        [0.299, 0.587, 0.114],
        [0.299, 0.587, 0.114],
        [0.299, 0.587, 0.114]
    ]
};

// 색약 시뮬레이션 적용
function simulateColorBlindness(hex, type) {
    const rgb = hexToRgbUniversal(hex);
    if (!rgb) return hex;
    
    const matrix = colorBlindnessMatrices[type];
    const r = Math.round(rgb.r * matrix[0][0] + rgb.g * matrix[0][1] + rgb.b * matrix[0][2]);
    const g = Math.round(rgb.r * matrix[1][0] + rgb.g * matrix[1][1] + rgb.b * matrix[1][2]);
    const b = Math.round(rgb.r * matrix[2][0] + rgb.g * matrix[2][1] + rgb.b * matrix[2][2]);
    
    return rgbToHexUniversal(
        Math.min(255, Math.max(0, r)),
        Math.min(255, Math.max(0, g)),
        Math.min(255, Math.max(0, b))
    );
}

// HEX to RGB 변환 (유니버설 시스템용)
function hexToRgbUniversal(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle 3-digit hex
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
}

// RGB to HEX 변환 (유니버설 시스템용)
function rgbToHexUniversal(r, g, b) {
    const toHex = (n) => {
        const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b).toUpperCase();
}

// 휘도 계산 (WCAG 2.1)
function getLuminanceUniversal(hex) {
    const rgb = hexToRgbUniversal(hex);
    if (!rgb) return 0;
    
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// 대비율 계산
function getContrastRatioUniversal(color1, color2) {
    const l1 = getLuminanceUniversal(color1);
    const l2 = getLuminanceUniversal(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// 대체 색상 생성
function generateSuggestedColors(bgColor, textColor) {
    const suggestions = [];
    const bgLum = getLuminanceUniversal(bgColor);
    
    // 테스트할 색상 목록
    const testColors = [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD',
        '#FA8072', '#20B2AA', '#87CEEB', '#98D8C8', '#F7DC6F',
        '#6666FF', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6',
        '#FF6B6B', '#333333', '#666666', '#999999'
    ];
    
    for (const color of testColors) {
        const ratio = getContrastRatioUniversal(bgColor, color);
        if (ratio > 4.5 && ratio > getContrastRatioUniversal(bgColor, textColor) * 1.2) {
            suggestions.push({
                color: color,
                ratio: ratio
            });
        }
    }
    
    // 대비율 기준으로 정렬하여 상위 6개 반환
    return suggestions
        .sort((a, b).slice(0, 6);
}

// 패턴 스타일 정의
const patternStyles = {
    stripes: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.15) 10px, rgba(0,0,0,0.15) 20px)`,
    dots: `radial-gradient(circle at 5px 5px, rgba(0,0,0,0.2) 2px, transparent 2px)`,
    grid: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
    diagonal: `repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0,0,0,0.15) 10px, rgba(0,0,0,0.15) 20px)`
};

const patternSizes = {
    stripes: 'auto',
    dots: '15px 15px',
    grid: '20px 20px',
    diagonal: 'auto'
};

// 디스플레이 업데이트
function updateUniversalDisplay() {
    const bgColor = universalColorState.currentBgColor;
    const textColor = universalColorState.currentTextColor;
    const cbType = universalColorState.currentCbType;
    
    // 원본 색상 표시
    const origBg = document.getElementById('origBg');
    const origText = document.getElementById('origText');
    
    if (origBg) {
        origBg.style.backgroundColor = bgColor;
        origBg.querySelector('.hex-code-sim').textContent = bgColor.toUpperCase();
        origBg.querySelector('.palette-label').style.color = textColor;
    }
    
    if (origText) {
        origText.style.backgroundColor = textColor;
        origText.querySelector('.hex-code-sim').textContent = textColor.toUpperCase();
        // 텍스트 색상에 맞춰 라벨 색상 조정
        const textLum = getLuminanceUniversal(textColor);
        origText.querySelector('.palette-label').style.color = textLum > 0.5 ? '#000000' : '#FFFFFF';
    }
    
    // 색약 시뮬레이션 적용
    const simBgColor = simulateColorBlindness(bgColor, cbType);
    const simTextColor = simulateColorBlindness(textColor, cbType);
    
    const simBg = document.getElementById('simBg');
    const simText = document.getElementById('simText');
    
    if (simBg) {
        simBg.style.backgroundColor = simBgColor;
        simBg.querySelector('.hex-code-sim').textContent = simBgColor.toUpperCase();
        simBg.querySelector('.palette-label').style.color = simTextColor;
    }
    
    if (simText) {
        simText.style.backgroundColor = simTextColor;
        simText.querySelector('.hex-code-sim').textContent = simTextColor.toUpperCase();
        // 텍스트 색상에 맞춰 라벨 색상 조정
        const simTextLum = getLuminanceUniversal(simTextColor);
        simText.querySelector('.palette-label').style.color = simTextLum > 0.5 ? '#000000' : '#FFFFFF';
    }
    
    // 패턴 적용
    const bgPattern = document.getElementById('bgPattern');
    const textPattern = document.getElementById('textPattern');
    
    if (universalColorState.patternEnabled) {
        if (bgPattern) {
            bgPattern.style.backgroundImage = patternStyles[universalColorState.currentPattern];
            bgPattern.style.backgroundSize = patternSizes[universalColorState.currentPattern];
            bgPattern.classList.add('active');
        }
        
        if (textPattern) {
            textPattern.style.backgroundImage = patternStyles[universalColorState.currentPattern];
            textPattern.style.backgroundSize = patternSizes[universalColorState.currentPattern];
            textPattern.classList.add('active');
        }
    } else {
        if (bgPattern) bgPattern.classList.remove('active');
        if (textPattern) textPattern.classList.remove('active');
    }
    
    // 색상 구분 가능성 체크
    const simRatio = getContrastRatioUniversal(simBgColor, simTextColor);
    const warningMsg = document.getElementById('warningMsg');
    const suggestedColors = document.getElementById('suggestedColors');
    
    if (simRatio < 3 || (cbType !== 'normal' && simRatio < 4.5)) {
        // 경고 메시지 표시
        if (warningMsg) warningMsg.classList.add('active');
        
        // 대체 색상 생성 및 표시
        const suggestions = generateSuggestedColors(bgColor, textColor);
        if (suggestedColors) {
            suggestedColors.innerHTML = suggestions.map(s => `
                <div class="suggested-color" data-color="${s.color}">
                    <div class="suggested-color-preview" style="background: ${s.color};"></div>
                    <div class="suggested-color-hex">${s.color}</div>
                    <div style="font-size: 10px; color: #999; margin-top: 4px;">비율: ${s.ratio.toFixed(1)}</div>
                </div>
            `).join('');
            
            // 클릭 이벤트 추가
            setTimeout(() => {
                document.querySelectorAll('.suggested-color').forEach(el => {
                    el.addEventListener('click', function() {
                        const color = this.dataset.color;
                        // 메인 텍스트 색상 입력 업데이트
                        const textInput = document.getElementById('text-color-input');
                        const textPicker = document.getElementById('text-color-picker');
                        if (textInput) {
                            textInput.value = color;
                            if (textPicker) textPicker.value = color;
                            // 메인 대비 테스트 업데이트 트리거
                            if (typeof updateContrast === 'function') {
                                updateContrast();
                            }
                        }
                        universalColorState.currentTextColor = color;
                        updateUniversalDisplay();
                    });
                });
            }, 0);
        }
    } else {
        // 경고 메시지 숨기기
        if (warningMsg) warningMsg.classList.remove('active');
        
        // 색상 대비 양호 메시지
        if (suggestedColors) {
            suggestedColors.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 14px;">✨ 색상 대비가 양호합니다<br>현재 대비율: ' + simRatio.toFixed(2) + ':1</div>';
        }
    }
}

// 색상 조작 헬퍼 함수들
function lightenColorUniversal(color, percent) {
    const rgb = hexToRgbUniversal(color);
    if (!rgb) return color;
    
    const amt = Math.round(2.55 * percent);
    const r = Math.min(255, rgb.r + amt);
    const g = Math.min(255, rgb.g + amt);
    const b = Math.min(255, rgb.b + amt);
    
    return rgbToHexUniversal(r, g, b);
}

function darkenColorUniversal(color, percent) {
    const rgb = hexToRgbUniversal(color);
    if (!rgb) return color;
    
    const amt = Math.round(2.55 * percent);
    const r = Math.max(0, rgb.r - amt);
    const g = Math.max(0, rgb.g - amt);
    const b = Math.max(0, rgb.b - amt);
    
    return rgbToHexUniversal(r, g, b);
}

// 보색 계산
function getComplementaryColorUniversal(color) {
    const rgb = hexToRgbUniversal(color);
    if (!rgb) return color;
    
    // HSL로 변환 후 180도 회전
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    // 보색 계산 (180도 회전)
    h = (h + 0.5) % 1;
    
    // HSL을 RGB로 다시 변환
    let r2, g2, b2;
    
    if (s === 0) {
        r2 = g2 = b2 = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r2 = hue2rgb(p, q, h + 1/3);
        g2 = hue2rgb(p, q, h);
        b2 = hue2rgb(p, q, h - 1/3);
    }
    
    return rgbToHexUniversal(
        Math.round(r2 * 255),
        Math.round(g2 * 255),
        Math.round(b2 * 255)
    );
}

// 초기화 시 실행
console.log('Universal Color System loaded successfully');// Universal Color System JavaScript
// 색약 시뮬레이션 및 접근성 솔루션 기능

// 전역 상태 관리
let universalColorState = {
    currentBgColor: '#F5F5F5',  // lab.html의 기본 배경색
    currentTextColor: '#333333', // lab.html의 기본 텍스트색
    currentCbType: 'normal',
    currentPattern: 'stripes',
    patternEnabled: false
};

// DOM이 로드되면 유니버설 컬러 시스템 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeUniversalColorSystem();
});

// 유니버설 컬러 시스템 초기화
function initializeUniversalColorSystem() {
    // 기존 색상 입력 필드와 연동 및 초기값 설정
    syncWithMainColorInputs();
    
    // 색약 유형 선택 이벤트 리스너
    document.querySelectorAll('input[name="cbType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            universalColorState.currentCbType = this.value;
            updateUniversalDisplay();
        });
    });
    
    // 패턴 토글
    const patternToggle = document.getElementById('patternToggle');
    if (patternToggle) {
        patternToggle.addEventListener('change', function() {
            universalColorState.patternEnabled = this.checked;
            const selector = document.getElementById('patternSelector');
            if (this.checked) {
                selector.classList.add('active');
            } else {
                selector.classList.remove('active');
            }
            updateUniversalDisplay();
        });
    }
    
    // 패턴 선택
    document.querySelectorAll('.pattern-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.pattern-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            universalColorState.currentPattern = this.dataset.pattern;
            if (universalColorState.patternEnabled) {
                updateUniversalDisplay();
            }
        });
    });
    
    // 초기 디스플레이 업데이트
    updateUniversalDisplay();
}

// 메인 색상 입력과 동기화
function syncWithMainColorInputs() {
    const bgColorInput = document.getElementById('bg-color-input');
    const textColorInput = document.getElementById('text-color-input');
    
    if (bgColorInput && textColorInput) {
        // 초기값 설정 (lab.html의 기본값 사용)
        universalColorState.currentBgColor = bgColorInput.value || '#F5F5F5';
        universalColorState.currentTextColor = textColorInput.value || '#333333';
        
        // 색상 변경 감지
        bgColorInput.addEventListener('input', function() {
            universalColorState.currentBgColor = this.value;
            updateUniversalDisplay();
        });
        
        textColorInput.addEventListener('input', function() {
            universalColorState.currentTextColor = this.value;
            updateUniversalDisplay();
        });
        
        // 색상 피커 변경 감지
        const bgPicker = document.getElementById('bg-color-picker');
        const textPicker = document.getElementById('text-color-picker');
        
        if (bgPicker) {
            bgPicker.addEventListener('input', function() {
                universalColorState.currentBgColor = this.value;
                updateUniversalDisplay();
            });
        }
        
        if (textPicker) {
            textPicker.addEventListener('input', function() {
                universalColorState.currentTextColor = this.value;
                updateUniversalDisplay();
            });
        }
    }
}

// 색약 시뮬레이션 매트릭스 (간소화: 적록색약만)
const colorBlindnessMatrices = {
    normal: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ],
    redgreen: [ // 적록색약 (가장 흔한 유형 - Deuteranopia 기준)
        [0.625, 0.375, 0],
        [0.7, 0.3, 0],
        [0, 0.3, 0.7]
    ]
};

// 색약 시뮬레이션 적용
function simulateColorBlindness(hex, type) {
    const rgb = hexToRgbUniversal(hex);
    if (!rgb) return hex;
    
    const matrix = colorBlindnessMatrices[type];
    const r = Math.round(rgb.r * matrix[0][0] + rgb.g * matrix[0][1] + rgb.b * matrix[0][2]);
    const g = Math.round(rgb.r * matrix[1][0] + rgb.g * matrix[1][1] + rgb.b * matrix[1][2]);
    const b = Math.round(rgb.r * matrix[2][0] + rgb.g * matrix[2][1] + rgb.b * matrix[2][2]);
    
    return rgbToHexUniversal(
        Math.min(255, Math.max(0, r)),
        Math.min(255, Math.max(0, g)),
        Math.min(255, Math.max(0, b))
    );
}

// HEX to RGB 변환 (유니버설 시스템용)
function hexToRgbUniversal(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle 3-digit hex
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
}

// RGB to HEX 변환 (유니버설 시스템용)
function rgbToHexUniversal(r, g, b) {
    const toHex = (n) => {
        const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b).toUpperCase();
}

// 휘도 계산 (WCAG 2.1)
function getLuminanceUniversal(hex) {
    const rgb = hexToRgbUniversal(hex);
    if (!rgb) return 0;
    
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// 대비율 계산
function getContrastRatioUniversal(color1, color2) {
    const l1 = getLuminanceUniversal(color1);
    const l2 = getLuminanceUniversal(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// 대체 색상 생성
function generateSuggestedColors(bgColor, textColor) {
    const suggestions = [];
    const bgLum = getLuminanceUniversal(bgColor);
    
    // 테스트할 색상 목록
    const testColors = [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD',
        '#FA8072', '#20B2AA', '#87CEEB', '#98D8C8', '#F7DC6F',
        '#6666FF', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6',
        '#FF6B6B', '#333333', '#666666', '#999999'
    ];
    
    for (const color of testColors) {
        const ratio = getContrastRatioUniversal(bgColor, color);
        if (ratio > 4.5 && ratio > getContrastRatioUniversal(bgColor, textColor) * 1.2) {
            suggestions.push({
                color: color,
                ratio: ratio
            });
        }
    }
    
    // 대비율 기준으로 정렬하여 상위 6개 반환
    return suggestions
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 6);