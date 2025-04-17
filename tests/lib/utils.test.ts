import { toSnakeCase } from '../../src/lib/utils';

describe('utils', () => {
  describe('toSnakeCase', () => {
    it('should return empty string for empty input', () => {
      expect(toSnakeCase('')).toBe('');
    });

    it('should convert camelCase to snake_case', () => {
      expect(toSnakeCase('camelCaseString')).toBe('camel_case_string');
    });

    it('should convert PascalCase to snake_case', () => {
      expect(toSnakeCase('PascalCaseString')).toBe('pascal_case_string');
    });

    it('should handle strings with numbers', () => {
      expect(toSnakeCase('stringWith1Number')).toBe('string_with1_number');
      expect(toSnakeCase('string1WithNumber')).toBe('string1_with_number');
      expect(toSnakeCase('String1With2Numbers3')).toBe('string1_with2_numbers3');
    });

    it('should handle strings starting with uppercase', () => {
      expect(toSnakeCase('StartsWithUpper')).toBe('starts_with_upper');
    });

    it('should handle consecutive uppercase letters correctly', () => {
      expect(toSnakeCase('stringWITHCaps')).toBe('string_with_caps');
      expect(toSnakeCase('anotherWITHMoreCaps')).toBe('another_with_more_caps');
      expect(toSnakeCase('HTTPRequest')).toBe('http_request');
      expect(toSnakeCase('someJSONData')).toBe('some_json_data');
    });

    it('should handle spaces and hyphens', () => {
      expect(toSnakeCase('string with spaces')).toBe('string_with_spaces');
      expect(toSnakeCase('string-with-hyphens')).toBe('string_with_hyphens');
      expect(toSnakeCase('string - with both _ and stuff')).toBe('string_with_both_and_stuff');
    });

    it('should handle existing underscores', () => {
      expect(toSnakeCase('string_with_underscores')).toBe('string_with_underscores');
      expect(toSnakeCase('multiple__underscores')).toBe('multiple_underscores');
    });

    it('should handle already snake_case strings', () => {
      expect(toSnakeCase('already_snake_case')).toBe('already_snake_case');
    });

    it('should handle edge cases like single letters or numbers', () => {
      expect(toSnakeCase('A')).toBe('a');
      expect(toSnakeCase('a')).toBe('a');
      expect(toSnakeCase('1')).toBe('1');
    });
  });
});
