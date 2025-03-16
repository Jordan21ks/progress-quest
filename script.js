class ProgressQuest {
    constructor() {
        this.skillsContainer = document.getElementById('skills-container');
        this.financialContainer = document.getElementById('financial-container');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.goalForm = document.getElementById('goal-form');
        this.skillsData = {};
        this.financialData = {};
        this.loadData();
    }

    async loadData() {
        try {
            const [skillsData, financialData] = await Promise.all([
                this.fetchData('http://localhost:5000/api/skills'),
                this.fetchData('http://localhost:5000/api/financial')
            ]);

            this.renderSkills(skillsData);
            this.renderFinancial(financialData);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showDemoData();
        }
    }

    async fetchData(url) {
        const response = await fetch(url);
        return response.json();
    }

    showDemoData() {
        // Demo data when API is not available
        this.skillsData = {
            'tennis': {'current': 7, 'max': 15, 'level': 2, 'unit': 'hours'},
            'bjj': {'current': 1, 'max': 15, 'level': 1, 'unit': 'hours'},
            'cycling': {'current': 0, 'max': 10, 'level': 1, 'unit': 'hours'},
            'skiing': {'current': 2, 'max': 8, 'level': 1, 'unit': 'hours'},
            'padel': {'current': 2, 'max': 10, 'level': 1, 'unit': 'hours'},
            'spanish': {'current': 1, 'max': 15, 'level': 1, 'unit': 'hours'},
            'pilates': {'current': 0, 'max': 10, 'level': 1, 'unit': 'hours'},
            'cooking': {'current': 0, 'max': 10, 'level': 1, 'unit': 'hours'}
        };

        this.financialData = {
            'debt_repayment': {'current': 0, 'target': 27000, 'level': 1, 'currency': '£'}
        };

        this.renderSkills(this.skillsData);
        this.renderFinancial(this.financialData);
    }

    formatValue(value, type, currency) {
        if (type === 'financial') {
            if (value >= 1000) {
                return new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: 'GBP',
                    maximumFractionDigits: 0,
                    notation: 'compact',
                    compactDisplay: 'short'
                }).format(value);
            } else {
                return new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: 'GBP',
                    maximumFractionDigits: 0
                }).format(value);
            }
        } else {
            return `${value}h`;
        }
    }

    createProgressBar(title, current, max, level, type = 'skill') {
        let percentage = (current / max) * 100;
        const formattedTitle = title.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        const currentFormatted = this.formatValue(current, type);
        const maxFormatted = this.formatValue(max, type);

        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.innerHTML = `
            <div class="progress-header">
                <div class="title-container">
                    <span class="progress-title">${formattedTitle}</span>
                    <span class="level-badge">Lvl ${level}</span>
                    <button class="edit-btn" onclick="app.editGoal('${title}', '${type}')">✏️</button>
                </div>
                <span class="progress-numbers">${currentFormatted} / ${maxFormatted}</span>
            </div>
            <div class="progress-bar ${percentage >= 90 ? 'glow' : ''}">
                <div class="progress-fill" style="width: ${percentage}%">
                    <span class="progress-percent">${Math.round(percentage)}%</span>
                </div>
            </div>
        `;
        return progressItem;
    }

    showAddForm(type) {
        this.modalTitle.textContent = type === 'skill' ? 'Add New Activity' : 'Add New Financial Goal';
        document.getElementById('goal-type').value = type;
        document.getElementById('goal-id').value = '';
        document.getElementById('goal-name').value = '';
        document.getElementById('goal-current').value = '0';
        document.getElementById('goal-target').value = '';
        this.modal.style.display = 'block';
    }

    editGoal(id, type) {
        const data = type === 'skill' ? this.skillsData[id] : this.financialData[id];
        this.modalTitle.textContent = type === 'skill' ? 'Edit Activity' : 'Edit Financial Goal';
        document.getElementById('goal-type').value = type;
        document.getElementById('goal-id').value = id;
        document.getElementById('goal-name').value = id.replace(/_/g, ' ');
        document.getElementById('goal-current').value = data.current;
        document.getElementById('goal-target').value = type === 'skill' ? data.max : data.target;
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    handleFormSubmit(event) {
        event.preventDefault();
        const type = document.getElementById('goal-type').value;
        const id = document.getElementById('goal-id').value;
        const name = document.getElementById('goal-name').value.toLowerCase().replace(/ /g, '_');
        const current = parseInt(document.getElementById('goal-current').value);
        const target = parseInt(document.getElementById('goal-target').value);

        if (type === 'skill') {
            const level = Math.floor((current / target) * 4) + 1;
            this.skillsData[id || name] = {
                current,
                max: target,
                level: Math.min(level, 4),
                unit: 'hours'
            };
            if (id && id !== name) delete this.skillsData[id];
            this.renderSkills(this.skillsData);
        } else {
            const level = Math.floor((current / target) * 4) + 1;
            this.financialData[id || name] = {
                current,
                target,
                level: Math.min(level, 4),
                currency: '£'
            };
            if (id && id !== name) delete this.financialData[id];
            this.renderFinancial(this.financialData);
        }

        this.closeModal();
    }

    renderSkills(data) {
        this.skillsContainer.innerHTML = '';
        Object.entries(data).forEach(([skill, info]) => {
            const progressBar = this.createProgressBar(
                skill, 
                info.current, 
                info.max, 
                info.level,
                'skill'
            );
            this.skillsContainer.appendChild(progressBar);
        });
    }

    renderFinancial(data) {
        this.financialContainer.innerHTML = '';
        Object.entries(data).forEach(([goal, info]) => {
            const progressBar = this.createProgressBar(
                goal,
                info.current,
                info.target,
                info.level,
                'financial'
            );
            this.financialContainer.appendChild(progressBar);
        });
    }

    // Close modal when clicking outside
    initModalClose() {
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        };
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ProgressQuest();
    app.initModalClose();
});
