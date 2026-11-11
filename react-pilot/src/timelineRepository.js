/*
 * Browser-only data adapter for the Timeline pilot.
 * Later, replace this adapter with calls to the main site's approved API.
 * Image Blobs and milestone records are stored together in IndexedDB.
 */

const DATABASE_NAME = 'grid-timeline-pilot';
const DATABASE_VERSION = 1;
const STORE_NAME = 'milestones';
const DEMO_FLAG = 'grid-timeline-demo-seeded-v1';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support IndexedDB.'));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open Timeline storage.'));
    request.onblocked = () => reject(new Error('Timeline storage is blocked by another browser tab.'));
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Timeline storage request failed.'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Timeline storage transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('Timeline storage transaction was cancelled.'));
  });
}

/** Read the existing browser store without seeding demos or writing records. */
export async function inspectLocalMilestones() {
  if (!('indexedDB' in window)) throw new Error('This browser does not support IndexedDB.');
  const database = await new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME);
    request.onupgradeneeded = (event) => {
      // Opening a missing database would otherwise create it. Abort the upgrade
      // so this review operation never creates or mutates local storage.
      event.preventDefault();
      request.transaction?.abort();
      reject(new Error('No existing Timeline browser database was found.'));
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not inspect Timeline browser data.'));
    request.onblocked = () => reject(new Error('Timeline storage is blocked by another browser tab.'));
  });

  try {
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      throw new Error('The existing Timeline browser database has an unexpected schema; it was not changed.');
    }
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const done = transactionDone(transaction);
    const milestones = await requestResult(transaction.objectStore(STORE_NAME).getAll());
    await done;
    return milestones;
  } finally {
    database.close();
  }
}

export function countLocalMilestonePhotos(milestones = []) {
  return milestones.reduce((count, milestone) => count + (milestone.images || []).length, 0);
}

function createDemoMilestones() {
  return [
    {
      id: 'demo-milestone-one',
      title: 'A milestone goes here',
      category: 'Community',
      date: '2024-09-14',
      time: '',
      location: 'Add the verified location',
      summary: 'A short introduction to this milestone. Replace this demo entry with a verified GRID moment.',
      description: 'This is demonstration content for the Timeline layout only. Replace the title, date, details and photographs with information confirmed by the GRID team before publishing.',
      images: [],
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-milestone-two',
      title: 'Another moment worth remembering',
      category: 'Workshops',
      date: '2025-03-22',
      time: '10:00',
      location: 'Add the verified location',
      summary: 'Use this card to show how a second milestone appears in the chronological story.',
      description: 'This is also placeholder content, not a claim about GRID history. An administrator can edit or delete it and add the real milestone information.',
      images: [],
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export async function loadMilestones({ seedWhenEmpty = true } = {}) {
  const database = await openDatabase();
  try {
    const readTransaction = database.transaction(STORE_NAME, 'readonly');
    const readDone = transactionDone(readTransaction);
    const existing = await requestResult(readTransaction.objectStore(STORE_NAME).getAll());
    await readDone;

    if (seedWhenEmpty && existing.length === 0 && !window.localStorage.getItem(DEMO_FLAG)) {
      const demoItems = createDemoMilestones();
      const writeTransaction = database.transaction(STORE_NAME, 'readwrite');
      const writeDone = transactionDone(writeTransaction);
      const store = writeTransaction.objectStore(STORE_NAME);
      demoItems.forEach((item) => store.put(item));
      await writeDone;
      window.localStorage.setItem(DEMO_FLAG, 'true');
      return demoItems;
    }

    return existing;
  } finally {
    database.close();
  }
}

export async function saveMilestone(milestone) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(STORE_NAME).put(milestone);
    await done;
    return milestone;
  } finally {
    database.close();
  }
}

export async function removeMilestone(id) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(STORE_NAME).delete(id);
    await done;
  } finally {
    database.close();
  }
}
