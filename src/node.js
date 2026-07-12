import { createDidYouKnowFetcher } from './index.js';
import { DOMParser } from 'linkedom';

const parseHTML = (html) => new DOMParser().parseFromString(html, "text/html");

const didyouknow = createDidYouKnowFetcher(parseHTML);

export default didyouknow;
