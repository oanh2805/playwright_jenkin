import { BeforeAll } from '@cucumber/cucumber';

BeforeAll(async function () {
    console.log('Minimal hooks loaded');
});