document.addEventListener('DOMContentLoaded', () => {
    // --- 전역 요소 선택 ---
    const mainPage = document.getElementById('main-page');
    const labPage = document.getElementById('lab-page');
    const navLinks = document.querySelectorAll('.nav-link');

    // --- 네비게이션 기능 ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // 기본 링크 동작 방지
            const targetId = e.target.dataset.target; // 클릭된 링크의 data-target 값 (페이지 ID)

            // 모든 네비게이션 링크의 'active' 클래스 제거
            navLinks.forEach(nav => nav.classList.remove('active'));
            // 클릭된 링크에 'active' 클래스 추가
            e.target.classList.add('active');

            // 페이지 전환 로직
            if (targetId === 'main-page') {
                mainPage.classList.add('active');
                labPage.classList.remove('active');
            } else {
                labPage.classList.add('active');
                mainPage.classList.remove('active');
                // Lab 페이지로 이동 시 Lab 페이지 초기화 함수 호출
                initializeLabPage();
            }
        });
    });

    // --- 메인 페이지 (AI 가이드 생성) 관련 요소 선택 ---
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
    let selectedService = null;
    let selectedPlatform = null;
    let selectedKeywords = new Set(); // 중복 방지를 위한 Set 사용
    let selectedPrimaryColor = null; // 선택된 주조 색상의 이름 (예: "blue")

    let knowledgeBase = {}; // knowledge_base.json 데이터를 저장할 객체

    // --- knowledge_base.json 파일 로드 ---
    // DOMContentLoaded 시점에 fetch를 시작하고, 데이터 로드 성공 시 모든 초기화 진행
    fetch('./knowledge_base.json')
        .then(response => {
            if (!response.ok) {
                // HTTP 응답이 200 OK가 아닐 경우 에러 발생
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // JSON 형태로 파싱
        })
        .then(data => {
            knowledgeBase = data; // 로드된 데이터를 knowledgeBase 변수에 저장
            setupDropdowns(); // 드롭다운 메뉴 초기 설정
            setupSliders(); // 슬라이더 초기 설정
            // 초기 AI 메시지 설정 (데이터 로드 성공 시)
            aiMessage.innerHTML = '서비스 목적과 OS/플랫폼을 선택하여 디자인 가이드를 생성하세요.';
        })
        .catch(error => {
            console.error('Error loading knowledge base:', error);
            // 데이터 로드 실패 시 사용자에게 메시지 표시 및 드롭다운 비활성화
            aiMessage.innerHTML = '<span style="color: red;">AI 지식 베이스를 불러오는 데 실패했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</span>';
            // 드롭다운 및 버튼 비활성화 (선택 방지)
            serviceDropdown.style.pointerEvents = 'none';
            platformDropdown.style.pointerEvents = 'none';
            generateBtn.style.pointerEvents = 'none';
            generateBtn.style.opacity = '0.5';
        });

    // --- 드롭다운 메뉴 설정 함수 ---
    function setupDropdowns() {
        // 서비스 드롭다운 설정
        const services = Object.keys(knowledgeBase.services);
        serviceMenu.innerHTML = ''; // 기존 메뉴 항목 초기화
        services.forEach(service => {
            const option = document.createElement('div');
            option.classList.add('dropdown-option');
            option.textContent = service;
            option.addEventListener('click', () => {
                serviceText.textContent = service; // 선택된 서비스 텍스트 업데이트
                selectedService = service; // 선택된 서비스 상태 업데이트
                serviceMenu.classList.remove('show'); // 메뉴 닫기
                serviceDropdown.classList.add('selected'); // 드롭다운 버튼 스타일 변경
                showNextStep('step02'); // 다음 단계 (STEP 02) 표시
                loadKeywords(); // 서비스 선택 시 키워드 로드
            });
            serviceMenu.appendChild(option);
        });

        // 플랫폼 드롭다운 설정
        const platforms = Object.keys(knowledgeBase.platforms);
        platformMenu.innerHTML = ''; // 기존 메뉴 항목 초기화
        platforms.forEach(platform => {
            const option = document.createElement('div');
            option.classList.add('dropdown-option');
            option.textContent = platform;
            option.addEventListener('click', () => {
                platformText.textContent = platform; // 선택된 플랫폼 텍스트 업데이트
                selectedPlatform = platform; // 선택된 플랫폼 상태 업데이트
                platformMenu.classList.remove('show'); // 메뉴 닫기
                platformDropdown.classList.add('selected'); // 드롭다운 버튼 스타일 변경
                showNextStep('step02'); // 다음 단계 (STEP 02) 표시
                loadKeywords(); // 플랫폼 선택 시 키워드 로드
            });
            platformMenu.appendChild(option);
        });

        // 드롭다운 토글 이벤트 리스너
        serviceDropdown.addEventListener('click', (e) => {
            e.stopPropagation(); // 이벤트 버블링 방지 (document 클릭 이벤트보다 먼저 처리)
            serviceMenu.classList.toggle('show'); // 서비스 메뉴 토글
            platformMenu.classList.remove('show'); // 다른 메뉴는 닫기
        });

        platformDropdown.addEventListener('click', (e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            platformMenu.classList.toggle('show'); // 플랫폼 메뉴 토글
            serviceMenu.classList.remove('show'); // 다른 메뉴는 닫기
        });

        // 드롭다운 외부 클릭 시 메뉴 닫기
        document.addEventListener('click', (e) => {
            // 클릭된 요소가 serviceDropdown 또는 serviceMenu 내부에 포함되지 않는 경우 닫기
            if (!serviceDropdown.contains(e.target) && !serviceMenu.contains(e.target)) {
                serviceMenu.classList.remove('show');
            }
            // 클릭된 요소가 platformDropdown 또는 platformMenu 내부에 포함되지 않는 경우 닫기
            if (!platformDropdown.contains(e.target) && !platformMenu.contains(e.target)) {
                platformMenu.classList.remove('show');
            }
        });
    }

    // --- 슬라이더 초기 설정 함수 (슬라이더 썸(thumb) 색상 업데이트) ---
    function setupSliders() {
        updateSliderThumbColor(softHardSlider);
        updateSliderThumbColor(staticDynamicSlider);

        softHardSlider.addEventListener('input', () => updateSliderThumbColor(softHardSlider));
        staticDynamicSlider.addEventListener('input', () => updateSliderThumbColor(staticDynamicSlider));
    }

    // --- 슬라이더 썸 색상을 슬라이더 값에 따라 업데이트하는 함수 ---
    function updateSliderThumbColor(slider) {
        const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        // 그라디언트 배경을 사용하여 슬라이더의 채워진 부분을 표시
        slider.style.background = `linear-gradient(to right, #6666ff 0%, #6666ff ${value}%, #e0e0e0 ${value}%, #e0e0e0 100%)`;
    }

    // --- 다음 단계 섹션을 표시하는 함수 ---
    function showNextStep(stepId) {
        const step = document.getElementById(stepId);
        if (step) {
            step.classList.remove('hidden');
        }
    }

    // --- 키워드 로드 함수 (서비스 및 플랫폼 선택 후 호출) ---
    function loadKeywords() {
        if (!selectedService || !selectedPlatform) {
            aiMessage.innerHTML = '서비스 목적과 OS/플랫폼을 선택하면 AI가 키워드를 추천해줍니다.';
            keywordTagsContainer.innerHTML = '';
            colorSelectionWrapper.style.display = 'none';
            generateBtn.classList.add('hidden');
            return;
        }

        aiMessage.innerHTML = `<span class="typing-cursor">|</span>`; // 타이핑 애니메이션 시작
        let message = `"${selectedService}" 서비스와 "${selectedPlatform}" 환경에 어울리는 핵심 키워드들을 제안합니다.`;
        // AI 메시지 타이핑 효과
        typeEffect(aiMessage, message, () => {
            aiMessage.innerHTML = message; // 타이핑 완료 후 커서 제거
            const serviceKeywords = knowledgeBase.services[selectedService].keywords;
            const platformKeywords = knowledgeBase.platforms[selectedPlatform].keywords;

            // 서비스와 플랫폼 키워드를 합쳐 중복 제거
            const combinedKeywords = [...new Set([...serviceKeywords, ...platformKeywords])];

            keywordTagsContainer.innerHTML = ''; // 기존 키워드 초기화
            selectedKeywords.clear(); // 선택된 키워드 초기화

            combinedKeywords.forEach(keyword => {
                const tag = document.createElement('span');
                tag.classList.add('tag');
                tag.textContent = keyword;
                tag.addEventListener('click', () => {
                    tag.classList.toggle('selected'); // 태그 클릭 시 선택/해제 토글
                    if (tag.classList.contains('selected')) {
                        selectedKeywords.add(keyword);
                    } else {
                        selectedKeywords.delete(keyword);
                    }
                    updateGenerateButtonVisibility(); // 버튼 가시성 업데이트
                });
                keywordTagsContainer.appendChild(tag);
            });
            showNextStep('step03'); // 다음 단계 (STEP 03) 표시
            colorSelectionWrapper.style.display = 'block'; // 색상 선택 영역 표시
            loadColorPalettes(); // 키워드 로드 후 색상 팔레트 로드
            updateGenerateButtonVisibility(); // 버튼 가시성 업데이트
        });
    }

    // --- 색상 팔레트 로드 함수 ---
    function loadColorPalettes() {
        colorSelection.innerHTML = ''; // 기존 팔레트 스와치 초기화
        selectedPrimaryColor = null; // 선택된 주조 색상 초기화

        const availablePalettes = knowledgeBase.colorPalettes;
        const colorNames = Object.keys(availablePalettes); // 팔레트 이름 (예: "blue", "red")

        colorNames.forEach(colorName => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            // 팔레트의 primary_main 색상으로 스와치 배경색 설정
            swatch.style.backgroundColor = availablePalettes[colorName].primary_main;
            swatch.title = colorName; // 툴팁으로 색상 이름 표시
            swatch.dataset.colorName = colorName; // 데이터 속성에 색상 이름 저장

            swatch.addEventListener('click', () => {
                // 모든 스와치의 'selected' 클래스 제거
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected'); // 클릭된 스와치에 'selected' 클래스 추가
                selectedPrimaryColor = colorName; // 선택된 주조 색상 이름 업데이트
                updateGenerateButtonVisibility(); // 버튼 가시성 업데이트
            });
            colorSelection.appendChild(swatch);
        });
    }

    // --- AI 가이드 생성 버튼의 가시성을 업데이트하는 함수 ---
    function updateGenerateButtonVisibility() {
        // 모든 필수 조건이 충족되면 버튼 표시, 아니면 숨김
        if (selectedService && selectedPlatform && selectedKeywords.size > 0 && selectedPrimaryColor) {
            generateBtn.classList.remove('hidden');
        } else {
            generateBtn.classList.add('hidden');
        }
    }

    // --- 타이핑 효과 함수 ---
    function typeEffect(element, text, callback) {
        let i = 0;
        element.innerHTML = `<span class="typing-cursor">|</span>`; // 초기 커서 표시
        const cursor = element.querySelector('.typing-cursor');

        const typingInterval = setInterval(() => {
            if (i < text.length) {
                const currentText = text.substring(0, i + 1);
                element.innerHTML = `${currentText}<span class="typing-cursor">|</span>`; // 텍스트 한 글자씩 추가 및 커서 유지
                i++;
            } else {
                clearInterval(typingInterval); // 타이핑 완료 시 인터벌 중지
                if (callback) callback(); // 콜백 함수 호출
            }
        }, 30); // 타이핑 속도 (밀리초)
    }

    // --- AI 가이드 생성 버튼 클릭 이벤트 리스너 ---
    generateBtn.addEventListener('click', generateGuide);

    // --- AI 가이드 생성 함수 ---
    function generateGuide() {
        // 모든 필수 입력값이 있는지 다시 확인
        if (!selectedService || !selectedPlatform || selectedKeywords.size === 0 || !selectedPrimaryColor) {
            aiMessage.textContent = '모든 필드를 선택해주세요!';
            return;
        }

        aiMessage.innerHTML = `<span class="typing-cursor">|</span>`; // 타이핑 애니메이션 시작
        let finalMessage = `선택하신 조건에 맞춰 AI 타이포그래피 디자인 가이드라인을 생성했습니다. 아래 리포트를 확인해 주세요!`;
        // AI 메시지 타이핑 효과
        typeEffect(aiMessage, finalMessage, () => {
            aiMessage.innerHTML = finalMessage; // 타이핑 완료 후 커서 제거
            displayAIReport(); // AI 리포트 표시 함수 호출
        });
    }

    // --- AI 리포트를 표시하고 내용 채우는 함수 ---
    function displayAIReport() {
        aiReport.style.display = 'block'; // AI 리포트 영역 표시
        guidelines.style.display = 'grid'; // 하단 가이드라인 표시

        // --- 컬러 시스템 섹션 채우기 ---
        const palette = knowledgeBase.colorPalettes[selectedPrimaryColor]; // 선택된 팔레트 데이터 가져오기
        
        // 각 색상 박스의 배경색과 헥사 코드 텍스트 업데이트
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

        // --- 타이포그래피 섹션 - 명도대비 설명 (고정 텍스트) ---
        document.getElementById('contrast-description').textContent = "WCAG 2.1 AA 등급(4.5:1) 이상을 기본으로 권장하며, AAA 등급(7:1)을 목표로 합니다. 대형 텍스트(18pt 이상 또는 굵은 글자 14pt 이상)는 3:1까지 허용됩니다.";

        // --- 타이포그래피 섹션 - 폰트 크기 설명 (플랫폼 기반 동적 생성) ---
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

        // AI 가이드 생성 후, 인터랙티브 실험실의 초기 색상을 가이드에서 제안하는 색상으로 업데이트
        updateLabPageColors(palette.primary_main, palette.primary_dark);
    }

    // --- Lab 페이지 (인터랙티브 실험실) 관련 요소 선택 ---
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

    // 폰트 단위 비교 요소
    const fontSizeInput = document.getElementById('font-size-input');
    const ptExample = document.getElementById('pt-example');
    const remExample = document.getElementById('rem-example');
    const spExample = document.getElementById('sp-example');

    // 유니버설 컬러 시스템 요소
    const normalRadio = document.getElementById('normal');
    const redgreenRadio = document.getElementById('redgreen');
    const origBg = document.getElementById('origBg');
    const origText = document.getElementById('origText');
    const simBg = document.getElementById('simBg');
    const simText = document.getElementById('simText');
    const solutionText = document.getElementById('solution-text');

    // --- Lab 페이지 초기화 함수 ---
    function initializeLabPage() {
        // 명도 대비 테스트 미리보기 초기 설정
        updateContrastTestPreview();
        
        // --- 명도 대비 테스트 입력 필드 이벤트 리스너 ---
        bgColorInput.addEventListener('input', updateContrastTestPreview);
        bgColorPicker.addEventListener('input', (e) => {
            bgColorInput.value = e.target.value.toUpperCase(); // 컬러 피커 값으로 텍스트 입력 필드 업데이트
            updateContrastTestPreview();
        });
        textColorInput.addEventListener('input', updateContrastTestPreview);
        textColorPicker.addEventListener('input', (e) => {
            textColorInput.value = e.target.value.toUpperCase(); // 컬러 피커 값으로 텍스트 입력 필드 업데이트
            updateContrastTestPreview();
        });
        lineheightInput.addEventListener('input', (e) => {
            lineHeightValue.textContent = e.target.value; // 줄 높이 값 표시 업데이트
            textPreview.style.lineHeight = e.target.value; // 미리보기 텍스트의 줄 높이 적용
        });

        // --- 폰트 단위 비교 초기화 ---
        updateFontUnitExamples();
        fontSizeInput.addEventListener('input', updateFontUnitExamples);

        // --- 유니버설 컬러 시스템 초기화 ---
        updateColorblindSimulator();
        normalRadio.addEventListener('change', updateColorblindSimulator); // 일반 시각 라디오 버튼 변경 시
        redgreenRadio.addEventListener('change', updateColorblindSimulator); // 적록색약 시각 라디오 버튼 변경 시
        // 명도 대비 테스트의 색상 변경 시 시뮬레이터도 업데이트
        bgColorInput.addEventListener('input', updateColorblindSimulator);
        textColorInput.addEventListener('input', updateColorblindSimulator);
    }

    // --- Lab 페이지의 색상을 AI 가이드 결과로 업데이트하는 함수 ---
    function updateLabPageColors(bgColor, textColor) {
        bgColorInput.value = bgColor.toUpperCase();
        bgColorPicker.value = bgColor.toUpperCase();
        textColorInput.value = textColor.toUpperCase();
        textColorPicker.value = textColor.toUpperCase();
        updateContrastTestPreview(); // 명도 대비 테스트 미리보기 업데이트
        updateColorblindSimulator(); // 색약 시뮬레이터 업데이트
    }

    // --- 두 헥사 코드 간의 명도 대비율을 계산하는 함수 (WCAG 알고리즘) ---
    function getContrastRatio(hex1, hex2) {
        // 헥사 코드를 RGB 배열로 변환
        function hexToRgb(hex) {
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);
            return [r, g, b];
        }

        // RGB 값으로 상대적 휘도(Luminance) 계산 (WCAG 기준)
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

        // 대비율 계산
        const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
        return ratio.toFixed(2); // 소수점 둘째 자리까지 반환
    }

    // --- 주어진 헥사 색상이 어두운지 밝은지 판단하는 함수 ---
    function isDarkColor(hex) {
        // hexToRgbForFilter 함수는 아래에 정의되어 있습니다.
        const rgb = hexToRgbForFilter(hex);
        // 밝기 계산 (ITU-R BT.709 공식)
        const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        return luminance < 0.5; // 0.5를 기준으로 어두움/밝음을 판단 (조정 가능)
    }

    // --- 배경색에 따라 헥사 코드 텍스트 색상을 동적으로 설정하는 함수 ---
    function setAdaptiveTextColor(element, bgColor) {
        if (isDarkColor(bgColor)) {
            element.style.color = '#FFFFFF'; // 어두운 배경일 경우 흰색 텍스트
        } else {
            element.style.color = 'rgba(0,0,0,0.8)'; // 밝은 배경일 경우 어두운 텍스트
        }
    }

    // --- 명도 대비 테스트 미리보기 및 결과 업데이트 함수 ---
    function updateContrastTestPreview() {
        const bgColor = bgColorInput.value;
        const textColor = textColorInput.value;

        textPreview.style.backgroundColor = bgColor;
        textPreview.style.color = textColor;

        const ratio = getContrastRatio(bgColor, textColor);
        contrastRatioDisplay.textContent = `${ratio} : 1`;

        // AA, AAA 상태 뱃지 업데이트
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

        // 색상 변경 시 색약 시뮬레이터도 업데이트
        updateColorblindSimulator();
    }

    // --- 폰트 단위 비교 예시를 업데이트하는 함수 ---
    function updateFontUnitExamples() {
        const basePx = parseFloat(fontSizeInput.value) || 16; // 기본값 16px

        // pt (포인트) 변환: 1px = 0.75pt (웹 환경의 96dpi 기준)
        const ptValue = (basePx * 0.75).toFixed(1); 
        ptExample.textContent = `${ptValue}pt`;
        ptExample.style.fontSize = `${ptValue}pt`; // 실제 pt 크기 적용

        // rem (루트 em) 변환: 기본 root 폰트 사이즈를 16px로 가정
        const remValue = (basePx / 16).toFixed(2);
        remExample.textContent = `${remValue}rem`;
        // rem은 CSS root 폰트 사이즈에 비례하므로, 여기서는 편의상 px로 적용하여 시각적 크기만 반영
        remExample.style.fontSize = `${basePx}px`; 

        // sp (안드로이드 Scale-independent Pixels) 변환: 기본 1sp = 1dp = 1px로 가정하며, 사용자의 폰트 크기 설정에 따라 스케일 됨.
        spExample.textContent = `${basePx}sp`;
        spExample.style.fontSize = `${basePx}px`; // 실제 px 크기로 시각적 크기만 반영
    }


    // --- 유니버설 컬러 시스템 (색약 시뮬레이션) 관련 함수 ---
    // 헥사 코드를 RGB 객체로 변환 (필터링 목적)
    function hexToRgbForFilter(hex) {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return { r, g, b };
    }

    // RGB 값을 헥사 코드로 변환
    function rgbToHex(r, g, b) {
        // 숫자가 한 자리일 경우 앞에 0을 붙여 두 자리로 만듦
        const toHex = (c) => `0${c.toString(16)}`.slice(-2);
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    }

    // 적록색약 (Deuteranomaly) 시뮬레이션 필터 (단순화된 행렬 적용)
    function simulateRedGreenColorblindness(r, g, b) {
        // Deuteranomaly (적색약/녹색약) 필터를 위한 변환 행렬
        // 이 행렬은 색약자가 세상을 보는 방식에 가깝게 색상을 조정합니다.
        const p = [
            0.625, 0.375, 0.000,
            0.700, 0.300, 0.000,
            0.000, 0.300, 0.700
        ]; 
        
        // 각 RGB 채널에 행렬을 적용하여 시뮬레이션된 색상 값 계산
        const r_sim = (r * p[0]) + (g * p[1]) + (b * p[2]);
        const g_sim = (r * p[3]) + (g * p[4]) + (b * p[5]);
        const b_sim = (r * p[6]) + (g * p[7]) + (b * p[8]);

        // 계산된 RGB 값이 0-255 범위를 벗어나지 않도록 조정 후 반올림
        return {
            r: Math.round(Math.min(255, Math.max(0, r_sim))),
            g: Math.round(Math.min(255, Math.max(0, g_sim))),
            b: Math.round(Math.min(255, Math.max(0, b_sim)))
        };
    }

    // --- 색약 시뮬레이터 UI 및 결과 업데이트 함수 ---
    function updateColorblindSimulator() {
        const currentBgHex = bgColorInput.value; // 현재 배경색
        const currentTextHex = textColorInput.value; // 현재 텍스트색

        // 원본 색상 팔레트 업데이트
        origBg.style.backgroundColor = currentBgHex;
        origBg.querySelector('.hex-code-sim').textContent = currentBgHex;
        setAdaptiveTextColor(origBg.querySelector('.hex-code-sim'), currentBgHex); // 배경색에 따른 헥사 코드 텍스트 색상 조정
        
        origText.style.backgroundColor = currentTextHex;
        origText.querySelector('.hex-code-sim').textContent = currentTextHex;
        setAdaptiveTextColor(origText.querySelector('.hex-code-sim'), currentTextHex); // 배경색에 따른 헥사 코드 텍스트 색상 조정

        if (redgreenRadio.checked) { // 적록색약 시뮬레이션 선택 시
            const bgRgb = hexToRgbForFilter(currentBgHex);
            const textRgb = hexToRgbForFilter(currentTextHex);

            // 시뮬레이션된 RGB 값 계산
            const simBgRgb = simulateRedGreenColorblindness(bgRgb.r, bgRgb.g, bgRgb.b);
            const simTextRgb = simulateRedGreenColorblindness(textRgb.r, textRgb.g, textRgb.b);

            // 시뮬레이션된 헥사 코드 변환
            const simBgHex = rgbToHex(simBgRgb.r, simBgRgb.g, simBgRgb.b);
            const simTextHex = rgbToHex(simTextRgb.r, simTextRgb.g, simTextRgb.b);

            // 시뮬레이션 결과 팔레트 업데이트
            simBg.style.backgroundColor = simBgHex;
            simBg.querySelector('.hex-code-sim').textContent = simBgHex;
            setAdaptiveTextColor(simBg.querySelector('.hex-code-sim'), simBgHex); // 배경색에 따른 헥사 코드 텍스트 색상 조정
            
            simText.style.backgroundColor = simTextHex;
            simText.querySelector('.hex-code-sim').textContent = simTextHex;
            setAdaptiveTextColor(simText.querySelector('.hex-code-sim'), simTextHex); // 배경색에 따른 헥사 코드 텍스트 색상 조정

            // 시뮬레이션된 색상으로 대비율 계산 및 솔루션 텍스트 업데이트
            const simulatedRatio = getContrastRatio(simBgHex, simTextHex);
            solutionText.innerHTML = getSolutionForColorblind(parseFloat(simulatedRatio), simulatedRatio);

        } else { // 일반 시각 선택 시 (시뮬레이션 없음)
            // 시뮬레이션 결과 팔레트를 원본 색상과 동일하게 설정
            simBg.style.backgroundColor = currentBgHex;
            simBg.querySelector('.hex-code-sim').textContent = currentBgHex;
            setAdaptiveTextColor(simBg.querySelector('.hex-code-sim'), currentBgHex); // 배경색에 따른 헥사 코드 텍스트 색상 조정
            
            simText.style.backgroundColor = currentTextHex;
            simText.querySelector('.hex-code-sim').textContent = currentTextHex;
            setAdaptiveTextColor(simText.querySelector('.hex-code-sim'), currentTextHex); // 배경색에 따른 헥사 코드 텍스트 색상 조정
            
            // 일반 시각용 솔루션 메시지
            solutionText.innerHTML = "일반 시각으로 색상을 보고 있습니다. 색약 시뮬레이션을 통해 접근성을 확인해 보세요.";
        }
    }

    // --- 색약 시뮬레이션 결과에 따른 AI 접근성 솔루션 텍스트 반환 함수 ---
    function getSolutionForColorblind(simulatedRatio, ratioText) {
        if (simulatedRatio < 3.0) {
            return `<span style='color: #f44336; font-weight: 600;'>🚨 대비 부족:</span> 시뮬레이션 결과, 대비율이 ${ratioText}:1로 매우 낮아 색상 구분에 심각한 문제가 있을 것으로 예상됩니다. 텍스트 또는 배경색 중 하나를 훨씬 밝거나 어둡게 변경하여 대비를 최소 4.5:1 이상으로 높여야 합니다. 색상 자체보다는 밝기 차이가 중요합니다.`;
        } else if (simulatedRatio < 4.5) {
            return `<span style='color: #ff9800; font-weight: 600;'>⚠️ 개선 필요:</span> 시뮬레이션 결과, 대비율이 ${ratioText}:1로 부족하여 적록색약 환경에서 텍스트 가독성이 떨어질 수 있습니다. 텍스트 또는 배경색의 밝기를 조정하여 명도 대비를 WCAG AA 기준(4.5:1) 이상으로 높이는 것을 권장합니다.`;
        } else {
            return `<span style='color: #4caf50; font-weight: 600;'>✅ 양호:</span> 시뮬레이션 결과, 대비율이 ${ratioText}:1로 충분하여 적록색약 환경에서도 텍스트를 명확하게 읽을 수 있습니다. 현재 색상 조합은 접근성 기준을 충족합니다.`;
        }
    }

    // 초기 로드 시 Lab 페이지가 활성화되어 있다면 초기화 함수 호출
    // (일반적인 경우 main-page가 먼저 활성화되므로 이 부분은 방어적 코드)
    if (labPage.classList.contains('active')) {
        initializeLabPage();
    }
});