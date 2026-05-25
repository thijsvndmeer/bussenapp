const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForImages = async (page) => {
  try {
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return;
        return new Promise((resolve) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        });
      }));
    });
  } catch (e) {
    console.error('Error waiting for images:', e);
  }
};

async function run() {
  console.log('Starting Vite server...');
  const vite = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true,
  });

  let serverStarted = false;
  let localUrl = 'http://localhost:3000';
  vite.stdout.on('data', (data) => {
    const str = data.toString();
    console.log('[Vite stdout]', str.trim());
    if (str.includes('localhost') || str.includes('Local:')) {
      const match = str.match(/http:\/\/localhost:\d+/);
      if (match) {
        localUrl = match[0];
      }
      serverStarted = true;
    }
  });

  vite.stderr.on('data', (data) => {
    console.error('[Vite stderr]', data.toString().trim());
  });

  // Wait for server to start (up to 15s)
  for (let i = 0; i < 30; i++) {
    if (serverStarted) break;
    await sleep(500);
  }

  // Create directories
  const appleDir = path.join(__dirname, 'public/screenshots/apple/iphone/en');
  const androidDir = path.join(__dirname, 'public/screenshots/android/phone/en');
  fs.mkdirSync(appleDir, { recursive: true });
  fs.mkdirSync(androidDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Force Dutch Language and hide patch notes
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('bus-app-language-v1', 'nl');
    localStorage.setItem('bus-app-patch-notes-seen-version', '1.2');
  });
  
  // Set up mock data
  const mockPlayers = [
    { id: '1', name: 'Triple T', hand: [], drinksTaken: 4, drinksDistributed: 8, adtjes: 0, isDealer: false, image: '/avatars/triple_t.png' },
    { id: '2', name: 'John Pork', hand: [], drinksTaken: 8, drinksDistributed: 2, adtjes: 0, isDealer: false, image: '/avatars/john_pork.png' },
    { id: '3', name: 'Rutger', hand: [], drinksTaken: 12, drinksDistributed: 5, adtjes: 1, isDealer: true, isImmune: false, image: '/avatars/rutger.png' }
  ];

  const suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
  let cardIdCounter = 0;
  const makeCard = (suit, rank) => ({ suit, rank, id: `${suit}-${rank}-${cardIdCounter++}` });

  const mockPyramid = [
    [makeCard('HEARTS', 14), makeCard('DIAMONDS', 10), makeCard('CLUBS', 8), makeCard('SPADES', 2), makeCard('HEARTS', 5)],
    [makeCard('DIAMONDS', 4), makeCard('CLUBS', 12), makeCard('SPADES', 7), makeCard('HEARTS', 9)],
    [makeCard('CLUBS', 3), makeCard('SPADES', 11), makeCard('HEARTS', 13)],
    [makeCard('SPADES', 6), makeCard('HEARTS', 8)],
    [makeCard('DIAMONDS', 2)]
  ];

  const mockBusCards = [
    makeCard('HEARTS', 4),
    makeCard('DIAMONDS', 8),
    makeCard('CLUBS', 12),
    makeCard('SPADES', 7),
    makeCard('HEARTS', 2)
  ];

  // We want to capture at 2 resolutions:
  // Apple iPhone: 390 x 844
  // Android Phone: 360 x 800
  const viewports = [
    { name: 'apple', width: 390, height: 844, dir: appleDir },
    { name: 'android', width: 360, height: 800, dir: androidDir }
  ];

  for (const vp of viewports) {
    console.log(`Capturing screenshots for ${vp.name}...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    
    // Slide 1: Setup Screen
    await page.goto(localUrl, { waitUntil: 'networkidle2' });
    await sleep(1500);

    // Set players via helper
    await page.evaluate((players) => {
      if (window.__screenshotHelpers) {
        window.__screenshotHelpers.setPlayers(players);
      } else {
        console.error('__screenshotHelpers not found!');
      }
    }, mockPlayers);
    await sleep(500);
    await waitForImages(page);
    await page.screenshot({ path: path.join(vp.dir, '01.png') });
    console.log(`Saved ${vp.name} 01.png`);

    // Slide 2: Round 1 (Red or Black Guessing)
    await page.evaluate((players) => {
      const helpers = window.__screenshotHelpers;
      helpers.setPhase('ROUNDS_1_4');
      helpers.setRoundStep(1);
      helpers.setActivePlayerIndex(0);
      helpers.setIsWaitingForNextPlayer(false);
      helpers.setFeedback(null);
      helpers.setLastDrawnCard(null);
    }, mockPlayers);
    await sleep(500);
    await waitForImages(page);
    await page.screenshot({ path: path.join(vp.dir, '02.png') });
    console.log(`Saved ${vp.name} 02.png`);

    // Slide 2b: Round 2 (Higher or Lower Guessing)
    await page.evaluate((players) => {
      const helpers = window.__screenshotHelpers;
      helpers.setPhase('ROUNDS_1_4');
      helpers.setRoundStep(2);
      helpers.setActivePlayerIndex(1); // John Pork (index 1)
      helpers.setPlayers(players.map((p, idx) => {
        if (idx === 1) {
          return { ...p, hand: [{ suit: 'HEARTS', rank: 8, id: 'h8' }] };
        }
        return p;
      }));
      helpers.setIsWaitingForNextPlayer(false);
      helpers.setFeedback(null);
      helpers.setLastDrawnCard(null);
    }, mockPlayers);
    await sleep(500);
    await waitForImages(page);
    await page.screenshot({ path: path.join(vp.dir, '03.png') });
    console.log(`Saved ${vp.name} 03.png`);

    // Slide 2c: Round 4 (Suit Guessing - Normal / Original)
    await page.evaluate((players) => {
      const helpers = window.__screenshotHelpers;
      helpers.setPhase('ROUNDS_1_4');
      helpers.setRoundStep(4);
      helpers.setActivePlayerIndex(2); // Rutger (index 2)
      helpers.setPlayers(players.map((p, idx) => {
        if (idx === 2) {
          return {
            ...p,
            hand: [
              { suit: 'HEARTS', rank: 14, id: 'h1' },
              { suit: 'HEARTS', rank: 3, id: 'h3' },
              { suit: 'SPADES', rank: 8, id: 's8' }
            ]
          };
        }
        return p;
      }));
      helpers.setIsWaitingForNextPlayer(false);
      helpers.setFeedback(null);
      helpers.setLastDrawnCard(null);
    }, mockPlayers);
    await sleep(500);
    await waitForImages(page);
    await page.screenshot({ path: path.join(vp.dir, '04.png') });
    console.log(`Saved ${vp.name} 04.png`);

    // Slide 2d: Round 4 (Suit Guessing - Disco Button Visible)
    await page.evaluate((players) => {
      const helpers = window.__screenshotHelpers;
      helpers.setPhase('ROUNDS_1_4');
      helpers.setRoundStep(4);
      helpers.setActivePlayerIndex(2); // Rutger (index 2)
      helpers.setPlayers(players.map((p, idx) => {
        if (idx === 2) {
          return {
            ...p,
            hand: [
              { suit: 'HEARTS', rank: 14, id: 'h1' },
              { suit: 'CLUBS', rank: 3, id: 'c3' },
              { suit: 'SPADES', rank: 8, id: 's8' }
            ]
          };
        }
        return p;
      }));
      helpers.setIsWaitingForNextPlayer(false);
      helpers.setFeedback(null);
      helpers.setLastDrawnCard(null);
    }, mockPlayers);
    await sleep(500);
    await waitForImages(page);
    await page.screenshot({ path: path.join(vp.dir, '04_disco.png') });
    console.log(`Saved ${vp.name} 04_disco.png`);

    // Slide 3: The Pyramid
    const p1 = mockPyramid[0][0].id;
    const p2 = mockPyramid[0][2].id;
    const p3 = mockPyramid[1][1].id;
    const p4 = mockPyramid[2][0].id;
    
    await page.evaluate((players, pyramid, revealedIds) => {
      const helpers = window.__screenshotHelpers;
      helpers.setPhase('PYRAMID');
      helpers.setPlayers(players.map((p) => ({
        ...p,
        hand: [
          { suit: 'HEARTS', rank: 14, id: 'h1' },
          { suit: 'CLUBS', rank: 3, id: 'c3' }
        ]
      })));
      helpers.setPyramid(pyramid);
      helpers.setRevealedPyramidCards(new Set(revealedIds));
    }, mockPlayers, mockPyramid, [p1, p2, p3, p4]);
    await sleep(500);
    await waitForImages(page);
    await page.screenshot({ path: path.join(vp.dir, '05.png') });
    console.log(`Saved ${vp.name} 05.png`);

    // Slide 4: The Bus
    await page.evaluate((players, busCards) => {
      const helpers = window.__screenshotHelpers;
      helpers.setPhase('THE_BUS');
      helpers.setBusDriver(players[2]);
      helpers.setBusPassengers([players[0]]);
      helpers.setBusCards(busCards);
      helpers.setCurrentBusIndex(2);
      helpers.setBusMode('digital');
      helpers.setIsBusEntrance(false);
      helpers.setIsBusWon(false);
      helpers.setFeedback({ text: "Goed geraden! Ga door naar de volgende kaart.", type: "success" });
    }, mockPlayers, mockBusCards);
    await sleep(500);
    await waitForImages(page);
    await page.screenshot({ path: path.join(vp.dir, '06.png') });
    console.log(`Saved ${vp.name} 06.png`);

    // Slide 5: Leaderboard / Results
    await page.evaluate((players) => {
      const helpers = window.__screenshotHelpers;
      helpers.setPhase('GAME_OVER');
      helpers.setPlayers(players);
      helpers.setImmunePlayerId('1'); // Triple T is immune
    }, mockPlayers);
    await sleep(500);
    await waitForImages(page);
    await page.screenshot({ path: path.join(vp.dir, '07.png') });
    console.log(`Saved ${vp.name} 07.png`);
  }

  console.log('All screenshots captured!');
  await browser.close();
  vite.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error during screenshot generation:', err);
  process.exit(1);
});
