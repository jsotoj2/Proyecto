document.addEventListener('DOMContentLoaded', () => {

    // 1. Filtro dinámico de Convocatorias
    const filterButtons = document.querySelectorAll('.filter-btn');
    const becaCards = document.querySelectorAll('.beca-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase active de todos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');

            becaCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // 2. Control de Modal de Postulación
    const modal = document.getElementById('applyModal');
    const closeModalBtn = document.getElementById('closeModal');
    const applyButtons = document.querySelectorAll('.apply-btn');
    const modalTitle = document.getElementById('modalBecaTitle');
    const applyForm = document.getElementById('applyForm');

    applyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const becaName = e.target.getAttribute('data-beca');
            modalTitle.textContent = `Postulación: ${becaName}`;
            modal.classList.add('active');
        });
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Envío del formulario de postulación
    applyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentName = document.getElementById('studentName').value;
        const generatedExp = 'EXP-2026-' + Math.floor(1000 + Math.random() * 9000);

        alert(`¡Solicitud enviada exitosamente!\n\nEstimado/a ${studentName}, tu número de expediente asignado es: ${generatedExp}. Consérvalo para consultar tu estado.`);
        
        applyForm.reset();
        modal.classList.remove('active');
    });

    // 3. Consulta Rápida por CUI (Formulario Hero)
    const quickForm = document.getElementById('quickCheckForm');
    const quickResult = document.getElementById('quickResult');

    quickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cui = document.getElementById('cuiInput').value;

        quickResult.classList.remove('hidden');
        quickResult.innerHTML = `
            <div style="color: var(--success); font-weight: 600;">
                <i class="fa-solid fa-circle-check"></i> Expediente Activo
            </div>
            <p style="margin-top: 5px;">CUI: <strong>${cui}</strong></p>
            <p>Estado: <span style="color: var(--primary); font-weight: 600;">En Evaluación por Comité</span></p>
        `;
    });

    // 4. Búsqueda Completa por Expediente
    const btnSearchExp = document.getElementById('btnSearchExp');
    const searchExpediente = document.getElementById('searchExpediente');
    const fullResultCard = document.getElementById('fullResultCard');

    btnSearchExp.addEventListener('click', () => {
        const exp = searchExpediente.value.trim();

        if (exp === '') {
            alert('Por favor ingresa un número de expediente válido.');
            return;
        }

        fullResultCard.classList.remove('hidden');
        fullResultCard.innerHTML = `
            <h4 style="color: var(--secondary); margin-bottom: 8px;">Detalle del Expediente: ${exp}</h4>
            <p><strong>Postulante:</strong> Estudiante Registrado</p>
            <p><strong>Programa:</strong> Beca de Educación Superior</p>
            <p><strong>Estatus:</strong> <span style="background: var(--warning); color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem;">DOCUMENTACIÓN REVISADA</span></p>
            <p style="font-size: 0.85rem; margin-top: 8px; color: var(--gray-300);">Próxima actualización estimada: 5 días hábiles.</p>
        `;
    });

    // 5. Desplazamiento Suave (Smooth Scroll) para la navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});