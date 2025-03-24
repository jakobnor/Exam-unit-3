import fetch from 'node-fetch';
import { load } from 'cheerio';
import fs from 'fs';

const PLAYER_NAME = 'jakobno@uia.no'; 
const BASE_URL = 'https://alchemy-kd0l.onrender.com'; 

const elementMappings = {
    gold: { symbol: '☉', modern: 'Au' },
    mercury: { symbol: '☿', modern: 'Hg' },
    silver: { symbol: '☽', modern: 'Ag' },
    iron: { symbol: '♂', modern: 'Fe' },
    copper: { symbol: '♀', modern: 'Cu' },
    lead: { symbol: '♄', modern: 'Pb' }
};

const symbolToElement = Object.entries(elementMappings).reduce((acc, [element, data]) => {
    acc[data.symbol] = element;
    return acc;
}, {});

async function startChallenge() {
    const response = await fetch(`${BASE_URL}/start?player=${encodeURIComponent(PLAYER_NAME)}`);
    return response.json();
}

async function submitAnswer(answer) {
    const response = await fetch(`${BASE_URL}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: PLAYER_NAME, answer: answer }),
    });
    return response.json();
}

function decodeFormula(formula) {
    return formula.split('')
        .map(symbol => elementMappings[symbolToElement[symbol]]?.modern)
        .filter(Boolean) 
        .join('');
}

async function solveChallenge(challenge) {
    
    if (challenge.key) return challenge.key;
    
    const challengeText = challenge.challenge || challenge.question;
    
    
    const formulaMatch = challengeText.match(/[☉☿☽♂♀♄]+/);
    if (formulaMatch) {
        return decodeFormula(formulaMatch[0]);
    }
    
    throw new Error('Unrecognized challenge format');
}

async function main() {
    try {
        let current = await startChallenge();
        
        while (true) {
            console.log('\n=== Current Challenge ===\n', current.challenge || current.question);

            
            if (current.key) {
                console.log('\n🔑 Final Key Found:', current.key);
                fs.writeFileSync('skeletonKey.txt', current.key);
                break;
            }

            const answer = await solveChallenge(current);
            console.log('\n=== Submitting Answer ===\n', answer);

            const result = await submitAnswer(answer);
            
            if (result.key) {
                console.log('\n🎉 Final Key:', result.key);
                fs.writeFileSync('skeletonKey.txt', result.key);
                break;
            }
            
            current = result.nextChallenge || result.challenge || result;
            
            
            if (!current || typeof current !== 'object') {
                console.error('Unexpected final response:', current);
                break;
            }
        }
    } catch (error) {
        console.error('Fatal error:', error);
    }
}

main();