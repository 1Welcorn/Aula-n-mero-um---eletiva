document.addEventListener('DOMContentLoaded', () => {
    const btnTVMode = document.getElementById('btnTVMode');
    const logoTVTrigger = document.getElementById('logoTVTrigger');
    const body = document.body;

    // 1. Gestão de Estado do Modo TV
    const isTVModeActive = localStorage.getItem('tvMode') === 'true';
    if (isTVModeActive) {
        body.classList.add('tv-mode');
    }

    if (btnTVMode) {
        btnTVMode.addEventListener('click', toggleTVMode);
    }

    if (logoTVTrigger) {
        logoTVTrigger.addEventListener('click', toggleTVMode);
    }

    function toggleTVMode() {
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // Sincronizar classe tv-mode com o estado real do Fullscreen
    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = !!document.fullscreenElement;
        if (isFullscreen) {
            body.classList.add('tv-mode');
            localStorage.setItem('tvMode', 'true');
        } else {
            body.classList.remove('tv-mode');
            localStorage.setItem('tvMode', 'false');
        }
    });

    // Se o localStorage diz que deve estar em modo TV, tenta entrar (pode falhar sem interação)
    if (isTVModeActive && !document.fullscreenElement) {
        // Nota: Browsers bloqueiam fullscreen automático sem clique, 
        // mas mantemos a classe para o layout se o usuário preferir assim.
        body.classList.add('tv-mode');
    }

    // 2. Expansor Magnético (Maximized Cards)
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Lógica especial para Hub Cards (Início)
            if (card.classList.contains('hub-card')) {
                if (!document.fullscreenElement) {
                    // Primeiro clique: Entra em modo TV e Maximiza para foco
                    toggleTVMode();
                    maximizeCard(card);
                } else {
                    // Segundo clique (já em Fullscreen): Navega para o slide
                    window.location.href = card.dataset.url;
                }
                return;
            }

            if (!card.classList.contains('maximized')) {
                maximizeCard(card);
            }
        });
    });

    function maximizeCard(card) {
        card.classList.add('maximized');
        
        // Criar botão de fechar
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.className = 'close-btn';
        card.appendChild(closeBtn);

        const close = (e) => {
            e.stopPropagation();
            card.classList.remove('maximized');
            closeBtn.remove();
            document.removeEventListener('keydown', escHandler);
        };

        closeBtn.onclick = close;

        const escHandler = (e) => {
            if (e.key === 'Escape') close(e);
        };
        document.addEventListener('keydown', escHandler);
    }

    // 3. Quiz Logic (Simple)
    const quizOptions = document.querySelectorAll('.quiz-option');
    quizOptions.forEach(option => {
        option.addEventListener('click', () => {
            const isCorrect = option.dataset.correct === 'true';
            if (isCorrect) {
                option.classList.add('correct');
                setTimeout(() => alert('Parabéns! Você manja de Cordel!'), 100);
            } else {
                option.classList.add('wrong');
                setTimeout(() => alert('Ops! Tente novamente.'), 100);
            }
        });
    });
});
