document.addEventListener('DOMContentLoaded', () => {
    const mainPage = document.getElementById('main-page');
    const labPage = document.getElementById('lab-page');
    const navLinks = document.querySelectorAll('.nav-link');

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.dataset.target;

            navLinks.forEach(nav => nav.classList.remove('active'));
            e.target.classList.add('active');

            if (targetId === 'main-page') {
                mainPage.classList.add('active');
                labPage.classList.remove('active');
            } else {
                labPage.classList.add('active');
                mainPage.classList.remove('active');
                // Lab 페이지 로드 시 필요한 초기화
                initializeLabPage();
            }
        });
    });

    // Main Page Logic
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

    let selectedService = null;
    let selectedPlatform = null;
    let selectedKeywords = new Set();
    let selectedPrimaryColor = null;

    let knowledgeBase = {};

    // Fetch knowledge_base.json
    fetch('./knowledge_base.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            knowledgeBase = data;
            setupDropdowns();
            setupSliders(); // 슬라이더 설정도 여기에서 호출
        })
        .catch(error => {
            console.error('Error loading knowledge base:', error);
            aiMessage.innerHTML = 'AI 지식 베이스를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.';
        });

    function setupDropdowns() {
        // Service Dropdown
        const services = Object.keys(knowledgeBase.services);
        serviceMenu.innerHTML = '';
        services.forEach(service => {
            const option = document.createElement('div');
            option.classList.add('dropdown-option');
            option.textContent = service;
            option.addEventListener('click', () => {
                serviceText.textContent = service;
                selectedService = service;
                serviceMenu.classList.remove('show');
                serviceDropdown.classList.add('selected');
                showNextStep('step02');
                loadKeywords(); // 서비스 선택 시 키워드 로드
            });
            serviceMenu.appendChild(option);
        });

        // Platform Dropdown
        const platforms = Object.keys(knowledgeBase.platforms);
        platformMenu.innerHTML = '';
        platforms.forEach(platform => {
            const option = document.createElement('div');
            option.classList.add('dropdown-option');
            option.textContent = platform;
            option.addEventListener('click', () => {
                platformText.textContent = platform;
                selectedPlatform = platform;
                platformMenu.classList.remove('show');
                platformDropdown.classList.add('selected');
                showNextStep('step02');
                loadKeywords(); // 플랫폼 선택 시 키워드 로드
            });
            platformMenu.appendChild(option);
        });

        serviceDropdown.addEventListener('click', () => {
            serviceMenu.classList.toggle('show');
            platformMenu.classList.remove('show');
        });

        platformDropdown.addEventListener('click', () => {
            platformMenu.classList.toggle('show');
            serviceMenu.classList.remove('show');
        });

        document.addEventListener('click', (e) => {
            if (!serviceDropdown.contains(e.target) && !serviceMenu.contains(e.target)) {
                serviceMenu.classList.remove('show');
            }
            if (!platformDropdown.contains(e.target) && !platformMenu.contains(e.target)) {
                platformMenu.classList.remove('show');
            }
        });
    }

    function setupSliders() {
        // Set initial slider thumb colors
        updateSliderThumbColor(softHardSlider);
        updateSliderThumbColor(staticDynamicSlider);

        softHardSlider.addEventListener('input', () => updateSliderThumbColor(softHardSlider));
        staticDynamicSlider.addEventListener('input', () => updateSliderThumbColor(staticDynamicSlider));
    }

    function updateSliderThumbColor(slider) {
        const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.background = `linear-gradient(to right, #6666ff 0%, #6666ff ${value}%, #e0e0e0 ${value}%, #e0e0e0 100%)`;
    }

    function showNextStep(stepId) {
        const step = document.getElementById(stepId);
        if (step) {
            step.classList.remove('hidden');
        }
    }

    function loadKeywords() {
        if (!selectedService || !selectedPlatform) {
            aiMessage.innerHTML = '서비스 목적과 OS/플랫폼을 선택하면 AI가 키워드를 추천해줍니다.';
            keywordTagsContainer.innerHTML = '';
            colorSelectionWrapper.style.display = 'none';
            generateBtn.classList.add('hidden');
            return;
        }

        aiMessage.innerHTML = `<span class="typing-cursor">|</span>`; // Typing animation start
        let message = `"${selectedService}" 서비스와 "${selectedPlatform}" 환경에 어울리는 핵심 키워드들을 제안합니다.`;
        typeEffect(aiMessage, message, () => {
            aiMessage.innerHTML = message; // Remove cursor after typing
            const serviceKeywords = knowledgeBase.services[selectedService].keywords;
            const platformKeywords = knowledgeBase.platforms[selectedPlatform].keywords;

            const combinedKeywords = [...new Set([...serviceKeywords, ...platformKeywords])]);

            keywordTagsContainer.innerHTML = '';
            selectedKeywords.clear(); // Reset selected keywords

            combinedKeywords.forEach(keyword => {
                const tag = document.createElement('span');
                tag.classList.add('tag');
                tag.textContent = keyword;
                tag.addEventListener('click', () => {
                    tag.classList.toggle('selected');
                    if (tag.classList.contains('selected')) {
                        selectedKeywords.add(keyword);
                    } else {
                        selectedKeywords.delete(keyword);
                    }
                    updateGenerateButtonVisibility();
                });
                keywordTagsContainer.appendChild(tag);
            });
            showNextStep('step03');
            colorSelectionWrapper.style.display = 'block';
            loadColorPalettes(); // 키워드 로드 후 색상 팔레트 로드
            updateGenerateButtonVisibility();
        });
    }

    function loadColorPalettes() {
        colorSelection.innerHTML = '';
        selectedPrimaryColor = null; // Reset selected color

        const availablePalettes = knowledgeBase.colorPalettes;
        const colorNames = Object.keys(availablePalettes);

        colorNames.forEach(colorName => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            swatch.style.backgroundColor = availablePalettes[colorName].primary_main;
            swatch.title = colorName; // 툴팁으로 색상 이름 표시
            swatch.dataset.colorName = colorName; // 데이터 속성에 색상 이름 저장

            swatch.addEventListener('click', () => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                selectedPrimaryColor = colorName;
                updateGenerateButtonVisibility();
            });
            colorSelection.appendChild(swatch);
        });
    }

    function updateGenerateButtonVisibility() {
        if (selectedService && selectedPlatform && selectedKeywords.size > 0 && selectedPrimaryColor) {
            generateBtn.classList.remove('hidden');
        } else {
            generateBtn.classList.add('hidden');
        }
    }

    function typeEffect(element, text, callback) {
        let i = 0;
        element.innerHTML = `<span class="typing-cursor">|</span>`;
        const cursor = element.querySelector('.typing-cursor');

        const typingInterval = setInterval(() => {
            if (i < text.length) {
                const currentText = text.substring(0, i + 1);
                element.innerHTML = `${currentText}<span class="typing-cursor">|</span>`;
                i++;
            } else {
                clearInterval(typingInterval);
                if (callback) callback();
            }
        }, 30); // Typing speed
    }


    generateBtn.addEventListener('click', generateGuide);

    function generateGuide() {
        if (!selectedService || !selectedPlatform || selectedKeywords.size === 0 || !selectedPrimaryColor) {
            aiMessage.textContent = '모든 필드를 선택해주세요!';
            return;
        }

        aiMessage.innerHTML = `<span class="typing-cursor">|</span>`; // Typing animation start
        let finalMessage = `선택하신 조건에 맞춰 AI 타이포그래피 디자인 가이드라인을 생성했습니다. 아래 리포트를 확인해 주세요!`;
        typeEffect(aiMessage, finalMessage, () => {
            aiMessage.innerHTML = finalMessage; // Remove cursor after typing
            displayAIReport();
        });
    }

    function displayAIReport() {
        aiReport.style.display = 'block';
        guidelines.style.display = 'grid'; // Enable bottom guidelines

        // Color System
        const palette = knowledgeBase.colorPalettes[selectedPrimaryColor];
        
        const primaryMain = document.getElementById('primary-main');
        primaryMain.style.backgroundColor = palette.primary_main;
        primaryMain.querySelector('.color-code').textContent = palette.primary_main;

        const secondaryMain = document.getElementById('secondary-main');
        secondaryMain.style.backgroundColor = palette.secondary_main;
        secondaryMain.querySelector('.color-code').textContent = palette.secondary_main;
        
        const primaryLight = document.getElementById('primary-light');
        primaryLight.style.backgroundColor = palette.primary_light;
        primaryLight.querySelector('.color-code').textContent = palette.primary_light;
        
        const secondaryLight = document.getElementById('secondary-light');
        secondaryLight.style.backgroundColor = palette.secondary_light;
        secondaryLight.querySelector('.color-code').textContent = palette.secondary_light;
        
        const primaryDark = document.getElementById('primary-dark');
        primaryDark.style.backgroundColor = palette.primary_dark;
        primaryDark.querySelector('.color-code').textContent = palette.primary_dark;
        
        const secondaryDark = document.getElementById('secondary-dark');
        secondaryDark.style.backgroundColor = palette.secondary_dark;
        secondaryDark.querySelector('.color-code').textContent = palette.secondary_dark;

        // Typography - Contrast Description (Static for now, can be dynamic)
        document.getElementById('contrast-description').textContent = "WCAG 2.1 AA 등급(4.5:1) 이상을 기본으로 권장하며, AAA 등급(7:1)을 목표로 합니다. 대형 텍스트(18pt 이상 또는 굵은 글자 14pt 이상)는 3:1까지 허용됩니다.";

        // Typography - Font Size Description (Dynamic based on selectedPlatform)
        const platformTypography = knowledgeBase.platforms[selectedPlatform].typography;
        let fontSizeText = `기본 텍스트 크기: ${platformTypography.baseFontSize}`;
        if (platformTypography.unit === 'px') {
            fontSizeText += ` (웹 환경 최적화)`;
        } else if (platformTypography.unit === 'pt') {
            fontSizeText += ` (iOS/macOS 환경 최적화)`;
        } else if (platformTypography.unit === 'sp') {
            fontSizeText += ` (Android 환경 최적화)`;
        }
        document.getElementById('font-size-description').textContent = fontSizeText;

        // Update Lab page initial colors based on generated guide
        updateLabPageColors(palette.primary_main, palette.primary_dark);
    }

    // Lab Page Logic
    const bgColorInput = document.getElementById('bg-color-input');
    const bgColorPicker = document.getElementById('bg-color-picker');
    const textColorInput = document.getElementById('text-color-input');
    const textColorPicker = document.getElementById('text-color-picker');
    const lineheightInput = document.getElementById('line-height-input');
    const lineHeightValue = document.getElementById('line-height-value');
    const contrastRatioDisplay = document.getElementById('contrast-ratio');
    const aaStatus = document.getElementById('aa-status');
    const aaaStatus = document.getElementById('aaa-status');
    const textPreview = document.getElementById('text-preview');

    // Font Unit Comparison elements
    const fontSizeInput = document.getElementById('font-size-input');
    const ptExample = document.getElementById('pt-example');
    const remExample = document.getElementById('rem-example');
    const spExample = document.getElementById('sp-example');

    // Universal Color System elements
    const normalRadio = document.getElementById('normal');
    const redgreenRadio = document.getElementById('redgreen');
    const origBg = document.getElementById('origBg');
    const origText = document.getElementById('origText');
    const simBg = document.getElementById('simBg');
    const simText = document.getElementById('simText');
    const solutionText = document.getElementById('solution-text');

    function initializeLabPage() {
        // Initial setup for contrast test
        updateContrastTestPreview();
        
        // Event Listeners for Contrast Test
        bgColorInput.addEventListener('input', updateContrastTestPreview);
        bgColorPicker.addEventListener('input', (e) => {
            bgColorInput.value = e.target.value.toUpperCase();
            updateContrastTestPreview();
        });
        textColorInput.addEventListener('input', updateContrastTestPreview);
        textColorPicker.addEventListener('input', (e) => {
            textColorInput.value = e.target.value.toUpperCase();
            updateContrastTestPreview();
        });
        lineheightInput.addEventListener('input', (e) => {
            lineHeightValue.textContent = e.target.value;
            textPreview.style.lineHeight = e.target.value;
        });

        // Initialize Font Unit Comparison
        updateFontUnitExamples();
        fontSizeInput.addEventListener('input', updateFontUnitExamples);

        // Initialize Universal Color System
        updateColorblindSimulator();
        normalRadio.addEventListener('change', updateColorblindSimulator);
        redgreenRadio.addEventListener('change', updateColorblindSimulator);
        // Also update simulator when contrast test colors change
        bgColorInput.addEventListener('input', updateColorblindSimulator);
        textColorInput.addEventListener('input', updateColorblindSimulator);
    }

    function updateLabPageColors(bgColor, textColor) {
        bgColorInput.value = bgColor.toUpperCase();
        bgColorPicker.value = bgColor.toUpperCase();
        textColorInput.value = textColor.toUpperCase();
        textColorPicker.value = textColor.toUpperCase();
        updateContrastTestPreview();
        updateColorblindSimulator();
    }


    function getContrastRatio(hex1, hex2) {
        function hexToRgb(hex) {
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);
            return [r, g, b];
        }

        function getLuminance(r, g, b) {
            const a = [r, g, b].map(v => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }

        const rgb1 = hexToRgb(hex1);
        const rgb2 = hexToRgb(hex2);

        const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
        const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);

        const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
        return ratio.toFixed(2);
    }

    // Function to determine if color is dark or light for adaptive text color
    function isDarkColor(hex) {
        const rgb = hexToRgbForFilter(hex);
        // Calculate perceived luminance (ITU-R BT.709 formula)
        const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        return luminance < 0.5; // Threshold 0.5 can be adjusted
    }

    // Function to set adaptive text color for hex codes
    function setAdaptiveTextColor(element, bgColor) {
        if (isDarkColor(bgColor)) {
            element.style.color = '#FFFFFF'; // White text for dark background
        } else {
            element.style.color = 'rgba(0,0,0,0.8)'; // Dark text for light background
        }
    }

    function updateContrastTestPreview() {
        const bgColor = bgColorInput.value;
        const textColor = textColorInput.value;

        textPreview.style.backgroundColor = bgColor;
        textPreview.style.color = textColor;

        const ratio = getContrastRatio(bgColor, textColor);
        contrastRatioDisplay.textContent = `${ratio} : 1`;

        aaStatus.classList.remove('pass', 'fail');
        aaaStatus.classList.remove('pass', 'fail');

        if (parseFloat(ratio) >= 4.5) {
            aaStatus.classList.add('pass');
        } else {
            aaStatus.classList.add('fail');
        }

        if (parseFloat(ratio) >= 7) {
            aaaStatus.classList.add('pass');
        } else {
            aaaStatus.classList.add('fail');
        }

        // Update colorblind simulator with current colors
        updateColorblindSimulator();
    }

    // Font Unit Conversion (New Function)
    function updateFontUnitExamples() {
        const basePx = parseFloat(fontSizeInput.value) || 16; // Default to 16px

        // pt (1px = 0.75pt, assuming 96dpi for web comparison)
        const ptValue = (basePx * 0.75).toFixed(1); 
        ptExample.textContent = `${ptValue}pt`;
        ptExample.style.fontSize = `${ptValue}pt`; // Apply actual pt size

        // rem (relative to root font-size, assume root is 16px)
        const remValue = (basePx / 16).toFixed(2);
        remExample.textContent = `${remValue}rem`;
        remExample.style.fontSize = `${remValue}rem`; // Apply actual rem size

        // sp (Android scaled pixels, often 1sp = 1px by default, but scales with user preference)
        spExample.textContent = `${basePx}sp`;
        spExample.style.fontSize = `${basePx}px`; // Apply actual px size for sp
    }


    // Universal Color System Functions (Revised)
    function hexToRgbForFilter(hex) {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return { r, g, b };
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    // Simplified Daltonize filter for red-green (deuteranomaly/protanomaly)
    function simulateRedGreenColorblindness(r, g, b) {
        const p = [
            0.625, 0.375, 0.000,
            0.700, 0.300, 0.000,
            0.000, 0.300, 0.700
        ]; // Deuteranomaly matrix
        
        const r_sim = (r * p[0]) + (g * p[1]) + (b * p[2]);
        const g_sim = (r * p[3]) + (g * p[4]) + (b * p[5]);
        const b_sim = (r * p[6]) + (g * p[7]) + (b * p[8]);

        return {
            r: Math.round(Math.min(255, Math.max(0, r_sim))),
            g: Math.round(Math.min(255, Math.max(0, g_sim))),
            b: Math.round(Math.min(255, Math.max(0, b_sim)))
        };
    }

    function updateColorblindSimulator() {
        const currentBgHex = bgColorInput.value;
        const currentTextHex = textColorInput.value;

        origBg.style.backgroundColor = currentBgHex;
        origBg.querySelector('.hex-code-sim').textContent = currentBgHex;
        setAdaptiveTextColor(origBg.querySelector('.hex-code-sim'), currentBgHex); // 적용
        
        origText.style.backgroundColor = currentTextHex;
        origText.querySelector('.hex-code-sim').textContent = currentTextHex;
        setAdaptiveTextColor(origText.querySelector('.hex-code-sim'), currentTextHex); // 적용

        if (redgreenRadio.checked) {
            const bgRgb = hexToRgbForFilter(currentBgHex);
            const textRgb = hexToRgbForFilter(currentTextHex);

            const simBgRgb = simulateRedGreenColorblindness(bgRgb.r, bgRgb.g, bgRgb.b);
            const simTextRgb = simulateRedGreenColorblindness(textRgb.r, textRgb.g, textRgb.b);

            const simBgHex = rgbToHex(simBgRgb.r, simBgRgb.g, simBgRgb.b);
            const simTextHex = rgbToHex(simTextRgb.r, simTextRgb.g, simTextRgb.b);

            simBg.style.backgroundColor = simBgHex;
            simBg.querySelector('.hex-code-sim').textContent = simBgHex;
            setAdaptiveTextColor(simBg.querySelector('.hex-code-sim'), simBgHex); // 적용
            
            simText.style.backgroundColor = simTextHex;
            simText.querySelector('.hex-code-sim').textContent = simTextHex;
            setAdaptiveTextColor(simText.querySelector('.hex-code-sim'), simTextHex); // 적용

            // Update solution text based on simulated contrast
            const simulatedRatio = getContrastRatio(simBgHex, simTextHex);
            solutionText.innerHTML = getSolutionForColorblind(parseFloat(simulatedRatio), simulatedRatio);

        } else { // Normal vision
            simBg.style.backgroundColor = currentBgHex;
            simBg.querySelector('.hex-code-sim').textContent = currentBgHex;
            setAdaptiveTextColor(simBg.querySelector('.hex-code-sim'), currentBgHex); // 적용
            
            simText.style.backgroundColor = currentTextHex;
            simText.querySelector('.hex-code-sim').textContent = currentTextHex;
            setAdaptiveTextColor(simText.querySelector('.hex-code-sim'), currentTextHex); // 적용
            
            solutionText.innerHTML = "일반 시각으로 색상을 보고 있습니다. 색약 시뮬레이션을 통해 접근성을 확인해 보세요.";
        }
    }

    function getSolutionForColorblind(simulatedRatio, ratioText) {
        if (simulatedRatio < 3.0) {
            return `<span style='color: #f44336; font-weight: 600;'>🚨 대비 부족:</span> 시뮬레이션 결과, 대비율이 ${ratioText}:1로 매우 낮아 색상 구분에 심각한 문제가 있을 것으로 예상됩니다. 텍스트 또는 배경색 중 하나를 훨씬 밝거나 어둡게 변경하여 대비를 최소 4.5:1 이상으로 높여야 합니다. 색상 자체보다는 밝기 차이가 중요합니다.`;
        } else if (simulatedRatio < 4.5) {
            return `<span style='color: #ff9800; font-weight: 600;'>⚠️ 개선 필요:</span> 시뮬레이션 결과, 대비율이 ${ratioText}:1로 부족하여 적록색약 환경에서 텍스트 가독성이 떨어질 수 있습니다. 텍스트 또는 배경색의 밝기를 조정하여 명도 대비를 WCAG AA 기준(4.5:1) 이상으로 높이는 것을 권장합니다.`;
        } else {
            return `<span style='color: #4caf50; font-weight: 600;'>✅ 양호:</span> 시뮬레이션 결과, 대비율이 ${ratioText}:1로 충분하여 적록색약 환경에서도 텍스트를 명확하게 읽을 수 있습니다. 현재 색상 조합은 접근성 기준을 충족합니다.`;
        }
    }

    // Initial load calls
    // Only call initializeLabPage if lab-page is active initially (unlikely, but for robustness)
    if (labPage.classList.contains('active')) {
        initializeLabPage();
    }
});