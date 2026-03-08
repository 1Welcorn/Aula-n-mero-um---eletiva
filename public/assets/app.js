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

        // 1. Gestão de Estado do Modo TV
        // Inicializar estado do localStorage
        try {
            if (localStorage.getItem('tvMode') === 'true') {
                body.classList.add('tv-mode');
            }
        } catch (e) {}

        if (btnTVMode) {
            btnTVMode.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isTVActive = body.classList.contains('tv-mode');
                if (!isTVActive) {
                    // Entrar em modo TV
                    body.classList.add('tv-mode');
                    try { localStorage.setItem('tvMode', 'true'); } catch (e) {}
                    
                    // Tenta entrar em Fullscreen (OBRIGATÓRIO ser direto no clique)
                    const doc = document.documentElement;
                    const requestFS = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
                    if (requestFS) {
                        requestFS.call(doc).catch(err => {
                            console.warn('Fullscreen bloqueado:', err);
                        });
                    }
                } else {
                    // Sair do modo TV
                    body.classList.remove('tv-mode');
                    try { localStorage.setItem('tvMode', 'false'); } catch (e) {}
                    
                    const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
                    if (exitFS) exitFS.call(document).catch(() => {});
                }
            });
        }

        if (logoTVTrigger) {
            logoTVTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isTVActive = body.classList.contains('tv-mode');
                if (!isTVActive) {
                    body.classList.add('tv-mode');
                    try { localStorage.setItem('tvMode', 'true'); } catch (e) {}
                    const doc = document.documentElement;
                    const requestFS = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
                    if (requestFS) requestFS.call(doc).catch(() => {});
                } else {
                    body.classList.remove('tv-mode');
                    try { localStorage.setItem('tvMode', 'false'); } catch (e) {}
                    const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
                    if (exitFS) exitFS.call(document).catch(() => {});
                }
            });
        }

        // Sincronizar apenas se o usuário sair do Fullscreen via ESC ou usar F11
        const handleFullscreenChange = () => {
            const isFullscreen = !!(document.fullscreenElement || 
                                   document.webkitFullscreenElement || 
                                   document.mozFullScreenElement || 
                                   document.msFullscreenElement);
            
            if (isFullscreen) {
                body.classList.add('tv-mode');
            } else {
                console.log('Fullscreen encerrado.');
            }
        };

        // Ouvir tecla F11 para sincronizar layout
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                // Aguarda um instante para o navegador processar o fullscreen nativo
                setTimeout(() => {
                    const isFullscreen = !!(document.fullscreenElement || window.innerWidth === screen.width);
                    if (isFullscreen) body.classList.add('tv-mode');
                }, 100);
            }
            if (e.key === 'Escape' && body.classList.contains('tv-mode')) {
                body.classList.remove('tv-mode');
            }
        });

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        // 2. Expansor Magnético (Maximized Cards)
        const cards = document.querySelectorAll('.card');
        console.log(`Encontrados ${cards.length} cartões.`);
        
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Se clicou no botão de fechar ou em algo interno que não deve triggar o card
                if (e.target.closest('.close-btn') || e.target.closest('a')) return;

                console.log('Cartão clicado:', card.querySelector('h3')?.innerText);
                
                // Lógica especial para Hub Cards (Início)
                if (card.classList.contains('hub-card')) {
                    const isTVActive = body.classList.contains('tv-mode');
                    
                    if (!isTVActive) {
                        body.classList.add('tv-mode');
                        try { localStorage.setItem('tvMode', 'true'); } catch (e) {}
                        const doc = document.documentElement;
                        const requestFS = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
                        if (requestFS) requestFS.call(doc).catch(() => {});
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

        console.log('Cordel Interativo: Scripts inicializados com sucesso.');
    } catch (globalError) {
        console.error('Erro crítico na inicialização do Cordel Interativo:', globalError);
    }
});
