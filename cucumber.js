/**
 * Cucumber.js configuration file
 */

process.env.ALLURE_RESULTS_DIR = process.env.ALLURE_RESULTS_DIR || 'allure-results';

module.exports = {
    default: {
        paths: ['src/features/**/*.feature'],

        require: [
            'src/support/**/*.ts',
            'src/steps/**/*.ts',
        ],

        requireModule: ['ts-node/register'],

        format: [
            'allure-cucumberjs/reporter:allure-results/dummy.txt',
            'summary',
            'progress-bar',
        ],

        formatOptions: {
            resultsDir: 'allure-results'
        },

        timeout: 60000,

        worldParameters: {
            baseUrl: process.env.BASE_URL || 'https://www.levents.asia/',
        },
    },
};
