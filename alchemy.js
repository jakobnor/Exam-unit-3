import fetch from 'node-fetch';
import { load } from 'cheerio';
import fs from 'fs';

const PLAYER_NAME = 'jakobno@uia.no'; 
const BASE_URL = 'https://alchemy-kd0l.onrender.com'; 

const elementMappings = {
    mercury: { symbol: '☿', modern: 'Hg' },
    gold: { symbol: '☉', modern: 'Au' },
    lead: { symbol: '♄', modern: 'Pb' },
    iron: { symbol: '♂', modern: 'Fe' },
    copper: { symbol: '♀', modern: 'Cu' },
    silver: { symbol: '☽', modern: 'Ag' },  
    tin: { symbol: '♃', modern: 'Sn' },     
    antimony: { symbol: '🜘', modern: 'Sb' } 
};

const symbolToElement = Object.entries(elementMappings).reduce((acc, [element, data]) => {
    acc[data.symbol] = element;
    return acc;
}, {});

async function startChallenge() {
    const response = await fetch(`${BASE_URL}/start?player=${encodeURIComponent(PLAYER_NAME)}`);
    if (!response.ok) throw new Error(`Start failed: ${response.status}`);
    return response.json();
}

async function submitAnswer(answer) {
    const response = await fetch(`${BASE_URL}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: PLAYER_NAME, answer: answer }),
    });
    if (!response.ok) throw new Error(`Answer failed: ${response.status}`);
    return response.json();
}

async function getClue() {
    const response = await fetch(`${BASE_URL}/clue?player=${encodeURIComponent(PLAYER_NAME)}`);
    const html = await response.text();
    return load(html).text();
}

function decodeFormula(formula) {
    return formula.split('')
        .map(symbol => symbolToElement[symbol] || '?')
        .join('');
}

async function solveChallenge(challenge) {
    
    const challengeText = challenge.challenge || challenge.question || challenge.data?.challenge;
    
    if (!challengeText) {
        console.error('Invalid challenge format:', challenge);
        throw new Error('Malformed challenge received');
    }

    
    const formulaMatch = challengeText.match(/[☿☉♄♂♀☽♃🜘]+/);
    if (formulaMatch) {
        const formula = formulaMatch[0];
        console.log('Decoding formula:', formula);
        const decoded = decodeFormula(formula);
        console.log('Decoded elements:', decoded);
        
       
        return decoded.split('').map(element => 
            elementMappings[element]?.modern || element
        ).join('');
    }

    
    const question = challengeText.toLowerCase();
    
    if (question.includes('ancient name')) {
        
    } else if (question.includes('modern name')) {
        
    }

    throw new Error('Unhandled challenge type');
}

async function main() {
    try {
        let current = await startChallenge();
        
        while (true) {
            console.log('\n=== Current Challenge ===\n', current.challenge || current.question);
            
            const answer = await solveChallenge(current);
            console.log('\n=== Submitting Answer ===\n', answer);
            
            const result = await submitAnswer(answer);
            
            if (result.key) {
                console.log('\n🎉 FINAL KEY:', result.key);
                fs.writeFileSync('skeletonKey.txt', result.key);
                break;
            }
            
            current = result.nextChallenge || result.challenge;
        }
    } catch (error) {
        console.error('Fatal error:', error);
    }
}

main();