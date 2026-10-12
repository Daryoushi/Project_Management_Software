/**
 * DOM Grabber (PHP & Web)
 * Integrated into Perfex Calendar Module for easy developer inspection
 * 
 * Features:
 * - Alt+G to toggle
 * - Prevents open popups/dropdowns from closing
 * - Press "C" or Ctrl+C or Click to copy element context
 * 
 * Author: Abolfazl Daryoushi
 * License: MIT
 */

(function () {
    'use strict';

    if (window.__DOM_GRABBER_INITIALIZED__) return;
    window.__DOM_GRABBER_INITIALIZED__ = true;

    var isActive = false;
    var hoveredElement = null;
    var overlay = null;
    var badge = null;
    var floater = null;
    var toast = null;

    function injectStyles() {
        var css = `
            .dom-grab-overlay {
                position: fixed;
                pointer-events: none;
                z-index: 99999998;
                border: 2px solid #2563eb;
                background-color: rgba(37, 99, 235, 0.08);
                border-radius: 4px;
                transition: all 0.08s cubic-bezier(0.16, 1, 0.3, 1);
                display: none;
                box-sizing: border-box;
            }

            .dom-grab-badge {
                position: fixed;
                pointer-events: none;
                z-index: 99999999;
                background: #0f172a;
                color: #f8fafc;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
                font-size: 11px;
                font-weight: 600;
                padding: 3px 8px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                display: none;
                white-space: nowrap;
                line-height: 1.4;
                letter-spacing: 0.02em;
            }

            .dom-grab-badge .dom-grab-tag {
                color: #38bdf8;
            }

            .dom-grab-badge .dom-grab-id {
                color: #f472b6;
            }

            .dom-grab-badge .dom-grab-class {
                color: #a3e635;
            }

            .dom-grab-badge .dom-grab-dim {
                color: #94a3b8;
                font-weight: normal;
                margin-left: 6px;
            }

            .dom-grab-floater {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 99999997;
                background: #0f172a;
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.15);
                padding: 8px 14px;
                border-radius: 10px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 12px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
                transition: transform 0.15s ease, background-color 0.15s ease;
                user-select: none;
            }

            .dom-grab-floater:hover {
                transform: translateY(-2px);
                background: #1e293b;
            }

            .dom-grab-floater.active {
                border-color: #38bdf8;
                box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
                background: #1e293b;
            }

            .dom-grab-floater-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #94a3b8;
                transition: background 0.15s ease;
            }

            .dom-grab-floater.active .dom-grab-floater-dot {
                background: #10b981;
                box-shadow: 0 0 8px #10b981;
            }

            .dom-grab-toast {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(30px);
                background: #0f172a;
                color: #ffffff;
                border: 1px solid #334155;
                padding: 10px 18px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 13px;
                font-weight: 500;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
                z-index: 100000000;
                opacity: 0;
                pointer-events: none;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .dom-grab-toast.visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        `;

        var style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    function initElements() {
        overlay = document.createElement('div');
        overlay.className = 'dom-grab-overlay';
        document.body.appendChild(overlay);

        badge = document.createElement('div');
        badge.className = 'dom-grab-badge';
        document.body.appendChild(badge);

        floater = document.createElement('div');
        floater.className = 'dom-grab-floater';
        floater.innerHTML = `
            <span class="dom-grab-floater-dot"></span>
            <span>DOM Grabber</span>
            <span style="opacity:0.6; font-size:10px; background:rgba(255,255,255,0.1); padding:2px 5px; border-radius:4px;">Alt+G</span>
        `;
        document.body.appendChild(floater);

        toast = document.createElement('div');
        toast.className = 'dom-grab-toast';
        document.body.appendChild(toast);

        floater.addEventListener('mousedown', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        floater.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });

        floater.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleGrabber();
        });
    }

    function toggleGrabber(forceState) {
        isActive = (forceState !== undefined) ? forceState : !isActive;
        if (isActive) {
            floater.classList.add('active');
            showToast('🎯 Grabber Active! Hover & click (or press C) to grab');
        } else {
            floater.classList.remove('active');
            hideHighlight();
            showToast('Grabber Deactivated');
        }
    }

    var toastTimeout = null;
    function showToast(message) {
        if (!toast) return;
        toast.innerHTML = message;
        toast.classList.add('visible');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(function () {
            toast.classList.remove('visible');
        }, 2200);
    }

    function highlightElement(el) {
        if (!el || el === overlay || el === badge || el === floater || el === toast || floater.contains(el)) {
            hideHighlight();
            return;
        }

        hoveredElement = el;
        var rect = el.getBoundingClientRect();

        overlay.style.top = rect.top + 'px';
        overlay.style.left = rect.left + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        overlay.style.display = 'block';

        var tagName = el.tagName.toLowerCase();
        var idStr = el.id ? '#' + el.id : '';
        var classes = Array.from(el.classList || [])
            .filter(function (c) { return !c.startsWith('dom-grab-'); })
            .slice(0, 3)
            .map(function (c) { return '.' + c; })
            .join('');

        var dimStr = Math.round(rect.width) + '×' + Math.round(rect.height);

        badge.innerHTML = `
            <span class="dom-grab-tag">&lt;${tagName}&gt;</span>
            <span class="dom-grab-id">${idStr}</span>
            <span class="dom-grab-class">${classes}</span>
            <span class="dom-grab-dim">${dimStr}</span>
        `;

        var badgeTop = rect.top - 28;
        if (badgeTop < 10) {
            badgeTop = rect.bottom + 6;
        }
        var badgeLeft = Math.max(10, rect.left);

        badge.style.top = badgeTop + 'px';
        badge.style.left = badgeLeft + 'px';
        badge.style.display = 'block';
    }

    function hideHighlight() {
        if (overlay) overlay.style.display = 'none';
        if (badge) badge.style.display = 'none';
        hoveredElement = null;
    }

    function getCssSelector(el) {
        if (!(el instanceof Element)) return '';
        var path = [];
        while (el && el.nodeType === Node.ELEMENT_NODE) {
            var selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break;
            } else {
                var sibling = el;
                var nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth > 1) selector += ':nth-of-type(' + nth + ')';
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(' > ');
    }

    function extractContext(el) {
        var tagName = el.tagName.toLowerCase();
        var clone = el.cloneNode(false);
        var openingTag = clone.outerHTML.replace(/<\/[^>]+>$/, '');
        var innerSnippet = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 80);

        var selector = getCssSelector(el);
        var closestForm = el.closest('form');
        var formAction = closestForm ? (closestForm.getAttribute('action') || '') : '';
        var containerSection = el.closest('[id], section, article, main, header, footer, nav, .panel, .card, .modal, .popover, .dropdown-menu');
        var containerDesc = containerSection ? (containerSection.tagName.toLowerCase() + (containerSection.id ? '#' + containerSection.id : (containerSection.className ? '.' + containerSection.className.trim().split(/\s+/)[0] : ''))) : 'body';

        var formattedOutput = [
            `[DOM GRAB]`,
            `Element: ${openingTag}`,
            `Text: "${innerSnippet}"`,
            `Selector: ${selector}`,
            `Container: ${containerDesc}`
        ];

        if (formAction) {
            formattedOutput.push(`Form Action: ${formAction}`);
        }

        var dataModule = el.closest('[data-module]') ? el.closest('[data-module]').getAttribute('data-module') : '';
        if (dataModule) {
            formattedOutput.push(`Module: ${dataModule}`);
        }

        return formattedOutput.join('\n');
    }

    function copyElementContext(el) {
        var text = extractContext(el);
        navigator.clipboard.writeText(text).then(function () {
            showToast('📋 Copied element context to clipboard!');
        }).catch(function () {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('📋 Copied element context to clipboard!');
        });
    }

    function bindEvents() {
        window.addEventListener('keydown', function (e) {
            if (e.altKey && (e.key === 'g' || e.key === 'G')) {
                e.preventDefault();
                e.stopPropagation();
                toggleGrabber();
                return;
            }

            if (!isActive) return;

            // Shortcut "C" to copy without clicking!
            if (e.key === 'c' || e.key === 'C') {
                var tag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toLowerCase() : '';
                if (tag !== 'input' && tag !== 'textarea') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (hoveredElement) {
                        copyElementContext(hoveredElement);
                    }
                    return;
                }
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                toggleGrabber(false);
            }
        }, true);

        window.addEventListener('mousemove', function (e) {
            if (!isActive) return;
            var target = document.elementFromPoint(e.clientX, e.clientY);
            highlightElement(target);
        }, true);

        window.addEventListener('click', function (e) {
            if (!isActive) return;

            if (floater && (e.target === floater || floater.contains(e.target))) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            if (hoveredElement) {
                copyElementContext(hoveredElement);
            }
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            injectStyles();
            initElements();
            bindEvents();
        });
    } else {
        injectStyles();
        initElements();
        bindEvents();
    }

})();
