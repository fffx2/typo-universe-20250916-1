document.addEventListener('DOMContentLoaded', () => {
    // --- 전역 요소 선택 ---
    const mainPage = document.getElementById('main-page');
    const labPage = document.getElementById('lab-page');
    const navLinks = document.querySelectorAll('.nav-link, .interactive-button');

    // --- 네비게이션 기능 ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.currentTarget.dataset.target;
            
            document.querySelectorAll('.main-page, .lab-page').forEach(page => {
                page.classList.remove('active');
                page.classList.add('hidden');
            });
            
            const targetPage = document.getElementById(targetId);
            if(targetPage) {
                targetPage.classList.remove('hidden');
                targetPage.classList.add('active');
            }

            document.querySelectorAll('.nav-link').forEach(nav => {
                nav.classList.toggle('active', nav.dataset.target === targetId);
            });

            if (targetId === 'lab-page') {
                initializeLabPage();
                if (appState.generatedResult) {
                    const { bgColor, textColor, fontSize } = appState.generatedResult;
                    updateLabPageWithData(bgColor, textColor, fontSize);
                }
            }
        });
    });

    // --- 메인 페이지 관련 요소 ---
    const serviceDropdown = document.getElementById('service-dropdown');
    const serviceMenu = document.getElementById('service-menu');
    const serviceText = document.getElementById('service-text');
    const platformDropdown = document.getElementById('platform-dropdown');
    const platformMenu = document.getElementById('platform-menu');
    const platformText = document.getElementById('platform-text');
    const softHardSlider = document.getElementById('soft-hard-slider');
    const staticDynamicSlider = document.getElementById('static-dynamic-slider');
    const keywordTagsContainer = document.getElementById('keyword-tags');
    const colorSelectionWrapper = document.getElementById('color-selection-wrapper');
    const colorSelection = document.getElementById('color-selection');
    const generateBtn = document.getElementById('generate-btn');
    const aiMessage = document.getElementById('ai-message');
    const aiReport = document.getElementById('ai-report');
    const guidelines = document.getElementById('guidelines');

    // --- 메인 페이지 상태 변수 ---
    const appState = {
        service: '',
        platform: '',
        mood: { soft: 50, static: 50 },
        keyword: '',
        primaryColor: '',
        generatedResult: null
    };

    let knowledgeBase = {};

    // --- 앱 초기화 ---
    async function initializeApp() {
        try {
            const response = await fetch('./knowledge_base.json');
            if (!response.ok) throw new Error('Network response was not ok');
            knowledgeBase = await response.json();
            
            initializeMainPage();

        } catch (error) {
            console.error('Failed to initialize app:', error);
            aiMessage.innerHTML = `<span style="color:red;">시스템 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.</span>`;
            document.querySelectorAll('.dropdown-item').forEach(item => item.style.pointerEvents = 'none');
        }
    }
    
    function initializeMainPage() {
        populateDropdown('service', ['포트폴리오', '브랜드 홍보', '제품 판매', '정보 전달', '학습', '엔터테인먼트']);
        populateDropdown('platform', ['iOS', 'Android', 'Web', 'Desktop', 'Tablet', 'Wearable', 'VR']);
        
        serviceDropdown.addEventListener('click', () => toggleDropdown('service'));
        platformDropdown.addEventListener('click', () => toggleDropdown('platform'));
        
        softHardSlider.addEventListener('input', updateMoodAndKeywords);
        staticDynamicSlider.addEventListener('input', updateMoodAndKeywords);

        generateBtn.addEventListener('click', generateGuide);
        updateAIMessage("안녕하세요! TYPOUNIVERSE AI Design Assistant입니다. 어떤 프로젝트를 위한 디자인 가이드를 찾으시나요? 먼저 서비스의 목적과 타겟 플랫폼을 알려주세요.");
    }

    function populateDropdown(type, options) {
        const menu = document.getElementById(`${type}-menu`);
        menu.innerHTML = '';
        options.forEach(optionText => {
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.textContent = optionText;
            option.onclick = () => selectOption(type, optionText);
            menu.appendChild(option);
        });
    }

    function toggleDropdown(type) {
        const menu = document.getElementById(`${type}-menu`);
        const otherMenu = type === 'service' ? platformMenu : serviceMenu;
        menu.classList.toggle('show');
        otherMenu.classList.remove('show');
    }

    function selectOption(type, value) {
        appState[type] = value;
        document.getElementById(`${type}-text`).textContent = value;
        document.getElementById(`${type}-dropdown`).classList.add('selected');
        toggleDropdown(type);

        if (appState.service && appState.platform) {
            document.getElementById('step02').classList.remove('hidden');
            const platformKey = appState.platform.toLowerCase();
            const platformGuide = knowledgeBase.guidelines[platformKey];
            if (platformGuide) {
                updateAIMessage(`${appState.platform} 플랫폼을 선택하셨군요! ${platformGuide.description} 권장 본문 크기는 ${platformGuide.defaultSize}입니다. 이제 서비스의 핵심 분위기를 정해주세요.`);
            }
        }
    }
    
    const updateMoodAndKeywords = () => {
        appState.mood.soft = parseInt(softHardSlider.value);
        appState.mood.static = parseInt(staticDynamicSlider.value);
        
        if (Math.abs(appState.mood.soft - 50) > 10 || Math.abs(appState.mood.static - 50) > 10) {
            document.getElementById('step03').classList.remove('hidden');
            renderKeywords();
        }
    };

    function renderKeywords() {
        const { soft, static: staticMood } = appState.mood;
        let groupKey = (soft < 40 && staticMood >= 60) ? 'group1' :
                     (soft < 40 && staticMood < 40) ? 'group2' :
                     (soft >= 60 && staticMood < 40) ? 'group3' :
                     (soft >= 60 && staticMood >= 60) ? 'group4' : 'group5';
    
        const group = knowledgeBase.iri_colors[groupKey];
        if (!group) return;

        keywordTagsContainer.innerHTML = '';
        group.keywords.forEach(keyword => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.textContent = keyword;
            tag.onclick = () => selectKeyword(keyword, groupKey);
            keywordTagsContainer.appendChild(tag);
        });
        updateAIMessage(`선택하신 '${group.description}' 분위기에 맞는 키워드들을 확인해 보세요.`);
    }

    function selectKeyword(keyword, groupKey) {
        appState.keyword = keyword;
        
        document.querySelectorAll('#keyword-tags .tag').forEach(tag => {
            tag.classList.toggle('selected', tag.textContent === keyword);
        });

        const colors = knowledgeBase.iri_colors[groupKey].key_colors;
        colorSelection.innerHTML = '';
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.background = color;
            swatch.onclick = () => selectColor(color);
            colorSelection.appendChild(swatch);
        });
        colorSelectionWrapper.style.display = 'block';
        updateAIMessage(`'${keyword}' 키워드에 어울리는 대표 색상들입니다. 주조 색상을 선택해주세요.`);
    }

    function selectColor(color) {
        appState.primaryColor = color;
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            const swatchColor = swatch.style.backgroundColor;
            const isSelected = (swatchColor === color) || (rgbToHexFromStr(swatchColor) === color.toUpperCase());
            swatch.classList.toggle('selected', isSelected);
        });
        generateBtn.classList.remove('hidden');
        updateAIMessage("최고의 선택입니다! 이 색상을 기준으로 가이드를 생성합니다.");
    }
    
    function generateGuide() {
        const { primaryColor, platform } = appState;
        if (!primaryColor || !platform) return;

        const primary = primaryColor;
        const primaryLight = lightenColor(primary, 20);
        const primaryDark = darkenColor(primary, 20);
        const secondary = getComplementaryColor(primary);
        const secondaryLight = lightenColor(secondary, 20);
        const secondaryDark = darkenColor(secondary, 20);
        
        const platformKey = platform.toLowerCase();
        const platformGuide = knowledgeBase.guidelines[platformKey] || knowledgeBase.guidelines.web;
        const textColorOnPrimary = getContrastRatio(primary, '#FFFFFF') > getContrastRatio(primary, '#333333') ? '#FFFFFF' : '#333333';
        
        appState.generatedResult = {
            bgColor: primary,
            textColor: textColorOnPrimary,
            fontSize: parseInt(platformGuide.defaultSize),
            palette: { primary, primaryLight, primaryDark, secondary, secondaryLight, secondaryDark },
            typography: { ...platformGuide },
            accessibility: {
                textColorOnPrimary,
                contrastRatio: getContrastRatio(primary, textColorOnPrimary) + ':1'
            }
        };

        displayGeneratedGuide();
    }

    function displayGeneratedGuide() {
        const { palette, typography, accessibility } = appState.generatedResult;

        updateColorBox('primary-main', palette.primary);
        updateColorBox('primary-light', palette.primaryLight);
        updateColorBox('primary-dark', palette.primaryDark);
        updateColorBox('secondary-main', palette.secondary);
        updateColorBox('secondary-light', palette.secondaryLight);
        updateColorBox('secondary-dark', palette.secondaryDark);

        document.getElementById('contrast-description').innerHTML = `Primary 색상 배경 사용 시, WCAG AA 기준을 충족하는 텍스트 색상은 <strong>${accessibility.textColorOnPrimary}</strong>이며, 대비는 <strong>${accessibility.contrastRatio}</strong>입니다.`;
        document.getElementById('font-size-description').innerHTML = `<strong>${typography.defaultSize}</strong> (본문) / <strong>${typography.typeScale.headline || typography.typeScale.largeTitle}</strong> (헤드라인)<br>최소 크기: <strong>${typography.minimumSize}</strong> / 단위: <strong>${typography.font.unit}</strong>`;

        aiReport.style.display = 'block';
        guidelines.style.display = 'grid';
        updateAIMessage(`${appState.platform} 플랫폼에 최적화된 디자인 가이드가 생성되었습니다!`);
    }

    function updateColorBox(id, color) {
        const element = document.getElementById(id);
        element.style.background = color;
        element.querySelector('.color-code').textContent = color;
        const textColor = getLuminance(color) > 0.4 ? '#333333' : '#FFFFFF';
        element.querySelector('.color-label').style.color = textColor;
        element.querySelector('.color-code').style.color = textColor;
    }

    // --- Lab 페이지 로직 ---
    let labInitialized = false;

    function initializeLabPage() {
        if (labInitialized) return;

        const bgColorInput = document.getElementById('bg-color-input');
        const bgColorPicker = document.getElementById('bg-color-picker');
        const textColorInput = document.getElementById('text-color-input');
        const textColorPicker = document.getElementById('text-color-picker');
        const lineHeightInput = document.getElementById('line-height-input');
        const fontSizeInput = document.getElementById('font-size-input');
        const normalRadio = document.getElementById('normal');
        const redgreenRadio = document.getElementById('redgreen');

        const updateAll = () => {
            updateContrastDisplay();
            updateFontUnits();
            updateUniversalColorDisplay();
        };

        bgColorInput.addEventListener('input', (e) => { bgColorPicker.value = e.target.value; updateAll(); });
        bgColorPicker.addEventListener('input', (e) => { bgColorInput.value = e.target.value; updateAll(); });
        textColorInput.addEventListener('input', (e) => { textColorPicker.value = e.target.value; updateAll(); });
        textColorPicker.addEventListener('input', (e) => { textColorInput.value = e.target.value; updateAll(); });
        lineHeightInput.addEventListener('input', updateContrastDisplay);
        fontSizeInput.addEventListener('input', updateFontUnits);
        normalRadio.addEventListener('change', updateUniversalColorDisplay);
        redgreenRadio.addEventListener('change', updateUniversalColorDisplay);
        
        updateAll();
        labInitialized = true;
    }

    function updateLabPageWithData(bgColor, textColor, fontSize) {
        document.getElementById('bg-color-input').value = bgColor;
        document.getElementById('bg-color-picker').value = bgColor;
        document.getElementById('text-color-input').value = textColor;
        document.getElementById('text-color-picker').value = textColor;
        document.getElementById('font-size-input').value = fontSize;
    }
    
    function updateContrastDisplay() {
        const bgColor = document.getElementById('bg-color-input').value;
        const textColor = document.getElementById('text-color-input').value;
        const lineHeight = document.getElementById('line-height-input').value;

        const ratio = getContrastRatio(bgColor, textColor);
        document.getElementById('contrast-ratio').textContent = `${ratio} : 1`;

        document.getElementById('aa-status').classList.toggle('pass', ratio >= 4.5);
        document.getElementById('aa-status').classList.toggle('fail', ratio < 4.5);
        document.getElementById('aaa-status').classList.toggle('pass', ratio >= 7);
        document.getElementById('aaa-status').classList.toggle('fail', ratio < 7);
        
        const preview = document.getElementById('text-preview');
        preview.style.backgroundColor = bgColor;
        preview.style.color = textColor;
        preview.style.lineHeight = lineHeight;
        document.getElementById('line-height-value').textContent = lineHeight;
    }

    function updateFontUnits() {
        const size = document.getElementById('font-size-input').value || 16;
        const pt = (parseFloat(size) * 0.75).toFixed(1);
        const rem = (parseFloat(size) / 16).toFixed(2);
        
        document.getElementById('pt-example').textContent = `${pt}pt`;
        document.getElementById('pt-example').style.fontSize = `${pt}pt`;
        document.getElementById('rem-example').textContent = `${rem}rem`;
        document.getElementById('rem-example').style.fontSize = `${rem}rem`;
        document.getElementById('sp-example').textContent = `${size}sp`;
        document.getElementById('sp-example').style.fontSize = `${size}px`;
    }

    function updateUniversalColorDisplay() {
        const bgColor = document.getElementById('bg-color-input').value;
        const textColor = document.getElementById('text-color-input').value;
        const cbType = document.querySelector('input[name="cbType"]:checked').value;

        updateSimColorBox('origBg', bgColor);
        updateSimColorBox('origText', textColor);

        if (cbType === 'redgreen') {
            const simBgColor = simulateColor(bgColor);
            const simTextColor = simulateColor(textColor);
            updateSimColorBox('simBg', simBgColor);
            updateSimColorBox('simText', simTextColor);
            const simRatio = getContrastRatio(simBgColor, simTextColor);
            document.getElementById('solution-text').innerHTML = getSolutionText(simRatio);
        } else {
            updateSimColorBox('simBg', bgColor);
            updateSimColorBox('simText', textColor);
            document.getElementById('solution-text').innerHTML = "일반 시각으로 색상을 보고 있습니다. 색약 시뮬레이션을 통해 접근성을 확인해 보세요.";
        }
    }

    function updateSimColorBox(id, color) {
        const box = document.getElementById(id);
        box.style.backgroundColor = color;
        const hexSim = box.querySelector('.hex-code-sim');
        hexSim.textContent = color.toUpperCase();
        const label = box.querySelector('.palette-label');
        const adaptiveColor = getLuminance(color) > 0.4 ? '#333333' : '#FFFFFF';
        hexSim.style.color = adaptiveColor;
        label.style.color = adaptiveColor;
    }

    function simulateColor(hex) {
        const matrix = {
            redgreen: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7]
        };
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        const [r, g, b] = rgb;
        const m = matrix.redgreen;
        const simR = Math.round(r * m[0] + g * m[1] + b * m[2]);
        const simG = Math.round(r * m[3] + g * m[4] + b * m[5]);
        const simB = Math.round(r * m[6] + g * m[7] + b * m[8]);
        return rgbToHexFromArr([simR, simG, simB]);
    }

    function getSolutionText(ratio) {
        if (ratio < 3.0) return `<span style='color: #f44336; font-weight: 600;'>🚨 대비 부족:</span> 시뮬레이션 대비율이 ${ratio}:1로 매우 낮아 구분이 어렵습니다. 색상 밝기를 조정하세요.`;
        if (ratio < 4.5) return `<span style='color: #ff9800; font-weight: 600;'>⚠️ 개선 필요:</span> 시뮬레이션 대비율이 ${ratio}:1로 다소 낮습니다. WCAG AA 기준(4.5:1) 이상을 권장합니다.`;
        return `<span style='color: #4caf50; font-weight: 600;'>✅ 양호:</span> 시뮬레이션 대비율이 ${ratio}:1로 충분합니다.`;
    }
    
    // --- 유틸리티 함수 ---
    function getLuminance(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return 0;
        const sRGB = rgb.map(val => {
            val /= 255;
            return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return sRGB[0] * 0.2126 + sRGB[1] * 0.7152 + sRGB[2] * 0.0722;
    }

    function getContrastRatio(color1, color2) {
        try {
            const lum1 = getLuminance(color1);
            const lum2 = getLuminance(color2);
            return ((Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05)).toFixed(2);
        } catch(e) { return 1; }
    }
    
    function hexToRgb(hex) {
        if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return [0,0,0];
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return [r, g, b];
    }
    
    function rgbToHexFromArr(rgb) {
        return "#" + rgb.map(x => {
            const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join('').toUpperCase();
    }
    
    function rgbToHexFromStr(rgbStr) {
        const match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return '#000000';
        return rgbToHexFromArr([parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]);
    }

    function lightenColor(color, percent) {
        const [r, g, b] = hexToRgb(color);
        const amount = Math.round(2.55 * percent);
        return rgbToHexFromArr([r + amount, g + amount, b + amount]);
    }

    function darkenColor(color, percent) {
        const [r, g, b] = hexToRgb(color);
        const amount = Math.round(2.55 * percent);
        return rgbToHexFromArr([r - amount, g - amount, b - amount]);
    }
    
    function getComplementaryColor(color) {
        const [r, g, b] = hexToRgb(color);
        return rgbToHexFromArr([255 - r, 255 - g, 255 - b]);
    }

    initializeApp();
});