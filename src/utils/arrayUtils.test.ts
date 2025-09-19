/**
 * 배열 유틸리티 함수 테스트
 * Jest를 사용한 단위 테스트
 */

import {
  shuffleArray,
  shuffleArrayWithSeed,
  getRandomElements,
  getRandomIndex,
  getRandomElement
} from './arrayUtils';

describe('arrayUtils', () => {
  describe('shuffleArray', () => {
    it('원본 배열을 수정하지 않아야 함', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      const shuffled = shuffleArray(original);

      expect(original).toEqual(originalCopy);
      expect(shuffled).not.toBe(original);
    });

    it('배열의 모든 요소를 포함해야 함', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('빈 배열을 처리할 수 있어야 함', () => {
      const result = shuffleArray([]);
      expect(result).toEqual([]);
    });

    it('단일 요소 배열을 처리할 수 있어야 함', () => {
      const original = [42];
      const result = shuffleArray(original);
      expect(result).toEqual([42]);
    });

    it('여러 번 호출 시 다른 결과를 반환해야 함 (확률적)', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const results = Array.from({ length: 10 }, () => shuffleArray(original));

      // 모든 결과가 동일하지 않을 가능성이 높음
      const allSame = results.every(result =>
        JSON.stringify(result) === JSON.stringify(results[0])
      );
      expect(allSame).toBe(false);
    });
  });

  describe('shuffleArrayWithSeed', () => {
    it('동일한 시드로 동일한 결과를 반환해야 함', () => {
      const original = [1, 2, 3, 4, 5];
      const seed = 12345;

      const result1 = shuffleArrayWithSeed(original, seed);
      const result2 = shuffleArrayWithSeed(original, seed);

      expect(result1).toEqual(result2);
    });

    it('다른 시드로 다른 결과를 반환해야 함', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const result1 = shuffleArrayWithSeed(original, 12345);
      const result2 = shuffleArrayWithSeed(original, 54321);

      expect(result1).not.toEqual(result2);
    });

    it('시드 없이 호출 시 매번 다른 결과를 반환해야 함', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const result1 = shuffleArrayWithSeed(original);
      const result2 = shuffleArrayWithSeed(original);

      // 현재 시간을 시드로 사용하므로 다를 가능성이 높음
      expect(result1).not.toEqual(result2);
    });
  });

  describe('getRandomElements', () => {
    it('지정된 개수만큼 요소를 반환해야 함', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const count = 5;
      const result = getRandomElements(original, count);

      expect(result).toHaveLength(count);
    });

    it('요청한 개수가 배열 길이보다 클 때 전체 배열을 반환해야 함', () => {
      const original = [1, 2, 3];
      const result = getRandomElements(original, 10);

      expect(result).toHaveLength(3);
      expect(result.sort()).toEqual(original.sort());
    });

    it('0개 요청 시 빈 배열을 반환해야 함', () => {
      const original = [1, 2, 3, 4, 5];
      const result = getRandomElements(original, 0);

      expect(result).toEqual([]);
    });

    it('원본 배열의 부분집합이어야 함', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = getRandomElements(original, 3);

      result.forEach(element => {
        expect(original).toContain(element);
      });
    });

    it('중복 없이 고유한 요소들을 반환해야 함', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = getRandomElements(original, 5);

      const uniqueElements = [...new Set(result)];
      expect(uniqueElements).toHaveLength(result.length);
    });
  });

  describe('getRandomIndex', () => {
    it('0부터 length-1 사이의 값을 반환해야 함', () => {
      const length = 10;
      for (let i = 0; i < 100; i++) {
        const index = getRandomIndex(length);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(length);
        expect(Number.isInteger(index)).toBe(true);
      }
    });

    it('길이가 1일 때 0을 반환해야 함', () => {
      const index = getRandomIndex(1);
      expect(index).toBe(0);
    });

    it('길이가 0일 때도 처리할 수 있어야 함', () => {
      const index = getRandomIndex(0);
      expect(index).toBe(0);
    });
  });

  describe('getRandomElement', () => {
    it('배열에서 하나의 요소를 반환해야 함', () => {
      const array = [1, 2, 3, 4, 5];
      const element = getRandomElement(array);

      expect(array).toContain(element);
    });

    it('빈 배열에서 undefined를 반환해야 함', () => {
      const element = getRandomElement([]);
      expect(element).toBeUndefined();
    });

    it('단일 요소 배열에서 해당 요소를 반환해야 함', () => {
      const array = [42];
      const element = getRandomElement(array);
      expect(element).toBe(42);
    });

    it('여러 번 호출 시 다양한 요소를 반환해야 함 (확률적)', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const results = Array.from({ length: 50 }, () => getRandomElement(array));

      // 최소 2개 이상의 서로 다른 값이 나와야 함
      const uniqueResults = [...new Set(results)];
      expect(uniqueResults.length).toBeGreaterThan(1);
    });
  });
});