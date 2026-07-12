import { createDidYouKnowFetcher } from './index.js';
import { DOMParser } from 'linkedom';

const parseHTML = (html) => new DOMParser().parseFromString(html, "text/html");

export const didyouknow = createDidYouKnowFetcher(parseHTML);
