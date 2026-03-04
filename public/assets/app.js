document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Cordel Interativo: Iniciando scripts...');
        
        const btnTVMode = document.getElementById('btnTVMode');
        const logoTVTrigger = document.getElementById('logoTVTrigger');
        const body = document.body;

        if (!body) {
            console.error('Erro: Elemento body não encontrado.');
            return;
        }

        // 1. Gestão de Estado do Modo TV (com tratamento de erro para localStorage)
        let isTVModeActive = false;
        try {
            isTVModeActive = localStorage.getItem('tvMode') === 'true';
        } catch (e) {
            console.warn('localStorage não disponível ou bloqueado:', e);
        }

        if (isTVModeActive) {
            body.classList.add('tv-mode');
        }

        const toggleTVMode = () => {
            console.log('Alternando Modo TV...');
            const doc = document.documentElement;
            const isFullscreen = document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement;

            try {
                if (!isFullscreen) {
                    if (doc.requestFullscreen) {
                        doc.requestFullscreen();
                    } else if (doc.webkitRequestFullscreen) {
                        doc.webkitRequestFullscreen();
                    } else if (doc.mozRequestFullScreen) {
                        doc.mozRequestFullScreen();
                    } else if (doc.msRequestFullscreen) {
                        doc.msRequestFullscreen();
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                }
            } catch (err) {
                console.error('Erro ao alternar Fullscreen:', err);
                // Fallback: apenas alterna a classe se o fullscreen falhar
                body.classList.toggle('tv-mode');
            }
        };

        if (btnTVMode) {
            btnTVMode.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTVMode();
            });
        }

        if (logoTVTrigger) {
            logoTVTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTVMode();
            });
        }

        // Sincronizar classe tv-mode com o estado real do Fullscreen
        const syncFullscreen = () => {
            const isFullscreen = !!(document.fullscreenElement || 
                                   document.webkitFullscreenElement || 
                                   document.mozFullScreenElement || 
                                   document.msFullscreenElement);
            
            console.log('Sincronizando Fullscreen:', isFullscreen);
            if (isFullscreen) {
                body.classList.add('tv-mode');
                try { localStorage.setItem('tvMode', 'true'); } catch(e) {}
            } else {
                body.classList.remove('tv-mode');
                try { localStorage.setItem('tvMode', 'false'); } catch(e) {}
            }
        };

        document.addEventListener('fullscreenchange', syncFullscreen);
        document.addEventListener('webkitfullscreenchange', syncFullscreen);
        document.addEventListener('mozfullscreenchange', syncFullscreen);
        document.addEventListener('MSFullscreenChange', syncFullscreen);

        // 2. Expansor Magnético (Maximized Cards)
        const cards = document.querySelectorAll('.card');
        console.log(`Encontrados ${cards.length} cartões.`);
        
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                console.log('Cartão clicado:', card.querySelector('h3')?.innerText);
                
                // Lógica especial para Hub Cards (Início)
                if (card.classList.contains('hub-card')) {
                    const isFullscreen = !!(document.fullscreenElement || 
                                           document.webkitFullscreenElement || 
                                           document.mozFullScreenElement || 
                                           document.msFullscreenElement);
                    
                    if (!isFullscreen) {
                        toggleTVMode();
                        maximizeCard(card);
                    } else {
                        const url = card.dataset.url;
                        if (url) window.location.href = url;
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
            closeBtn.setAttribute('aria-label', 'Fechar');
            card.appendChild(closeBtn);

            const close = (e) => {
                if (e) e.stopPropagation();
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

        // 3. Quiz Logic
        const quizOptions = document.querySelectorAll('.quiz-option');
        quizOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
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

        console.log('Cordel Interativo: Scripts inicializados com sucesso.');
    } catch (globalError) {
        console.error('Erro crítico na inicialização do Cordel Interativo:', globalError);
    }
});
