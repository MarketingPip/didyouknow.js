import { createDidYouKnowFetcher } from './index.js';

const parseHTML = (html) => new DOMParser().parseFromString(html, "text/html");

export const  didyouknow = createDidYouKnowFetcher(parseHTML);
