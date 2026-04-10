import { renderTemplate } from '../../app/templates/renderer.js';
import { hideFieldError, showFieldError } from '../../modules/auth/shared/field-messages.js';
import { isValidEmail } from '../../modules/auth/shared/validators.js';

/** @typedef {import('../../types/router.js').RouteContext} RouteContext */
/** @typedef {import('../../types/router.js').RouteView} RouteView */

/**
 * Выставляет финальное состояние билетов без анимации.
 *
 * @param {ParentNode | null | undefined} root Корневой узел страницы.
 * @returns {void}
 */
function setTicketsFinalState(root) {
	if (!root) return;

	const loginEl = root.classList.contains('login')
		? root
		: root.querySelector('.login');

	if (loginEl) {
		loginEl.classList.add('loaded');
	}
}

/**
 * Выполняет SPA-навигацию без полной перезагрузки страницы.
 *
 * @param {string} path Путь для перехода.
 * @returns {void}
 */
function navigateSpa(path) {
	window.history.pushState(null, '', path);
	window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Подключает валидацию email и переход ко второму шагу.
 *
 * @param {ParentNode} root Корневой узел страницы.
 * @param {{ email?: string, step?: number }} state Состояние страницы.
 * @param {() => void} rerender Функция перерендера.
 * @returns {void}
 */
function setupStep1(root, state, rerender) {
	const emailInput = root.querySelector('#email');
	const submitBtn = root.querySelector('.login__submit');
	const backLink = root.querySelector('.login__register');

	let emailError = false;

	/**
	 * Показывает ошибку у поля email.
	 *
	 * @param {Element} wrapper Обертка поля.
	 * @param {string} msg Текст ошибки.
	 * @returns {void}
	 */
	emailInput.value = state.email || '';

	emailInput.addEventListener('input', function () {
		if (!emailError) return;

		const wrapper = this.closest('.login__field-error-wrapper');
		const value = this.value.trim();

		if (!value) {
			showFieldError(wrapper, 'Поле email не должно быть пустым!');
		} else if (!isValidEmail(value)) {
			showFieldError(wrapper, 'Введите email в формате address@service.com!');
		} else {
			hideFieldError(wrapper);
			emailError = false;
		}
	});

	submitBtn.addEventListener('click', function (e) {
		e.preventDefault();

		const wrapper = emailInput.closest('.login__field-error-wrapper');
		const value = emailInput.value.trim();

		emailError = false;

		if (!value) {
			showFieldError(wrapper, 'Поле email не должно быть пустым!');
			emailError = true;
		} else if (!isValidEmail(value)) {
			showFieldError(wrapper, 'Введите email в формате address@service.com!');
			emailError = true;
		} else {
			hideFieldError(wrapper);
		}
		
		if (emailError) return;

		state.email = value;
		state.step = 2;

		rerender();
	});

	if (backLink) {
		backLink.addEventListener('click', function (e) {
			e.preventDefault();
			navigateSpa('/login');
		});
	}
}

/**
 * Подключает SPA-переход с финального шага сброса пароля.
 *
 * @param {ParentNode} root Корневой узел страницы.
 * @returns {void}
 */
function setupStep2(root) {
	const backBtn = root.querySelector('.js-go-login');

	if (!backBtn) return;

	backBtn.addEventListener('click', function (e) {
		e.preventDefault();
		navigateSpa('/login');
	});
}

/**
 * Возвращает имя шаблона для текущего шага сброса пароля.
 *
 * @param {number} step Номер шага.
 * @returns {string}
 */
function getStepTemplate(step) {
	switch (step) {
		case 1:
			return 'reset_password-step1';
		case 2:
			return 'reset_password-step2';
		default:
			return 'reset_password-step1';
	}
}

/**
 * Монтирует представление страницы и подключает обработчики активного шага.
 *
 * @param {HTMLElement} root Корневой элемент страницы.
 * @param {{ step?: number, email?: string }} state Состояние страницы.
 * @param {() => void} rerender Функция перерендера.
 * @returns {void}
 */
function mountPasswordReset(root, state, rerender) {
	setTicketsFinalState(root);

	if (state.step === 1) {
		setupStep1(root, state, rerender);
	}

	if (state.step === 2) {
		setupStep2(root);
	}
}

/**
 * Создает объект представления для многошагового сброса пароля.
 *
 * @param {Record<string, any>} [state] Состояние страницы.
 * @returns {{ html: string, mount(root: HTMLElement): void }}
 */
function createPasswordResetView(state = {}) {
	state.step = state.step || 1;

	const html = `
		<main class="login">
			${renderTemplate('login-aside')}
			${renderTemplate(getStepTemplate(state.step), state)}
		</main>
	`;

	return {
		html,
		mount(root) {
			root.innerHTML = this.html;

			const rerender = () => {
				const view = createPasswordResetView(state);
				view.mount(root);
			};

			mountPasswordReset(root, state, rerender);
		}
	};
}

/**
 * Возвращает представление страницы сброса пароля.
 *
 * @returns {{ html: string, mount(root: HTMLElement): void }}
 */
/**
 * @param {RouteContext} [_context]
 * @returns {RouteView}
 */
export function passwordResetPage() {
	return createPasswordResetView();
}
