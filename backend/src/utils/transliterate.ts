/**
 * Simple transliteration map for Arabic characters to English.
 * Focused on the first character for asset ID prefix.
 */
const arabicToEnglishMap: { [key: string]: string } = {
    'ا': 'A', 'أ': 'A', 'إ': 'I', 'آ': 'A',
    'ب': 'B',
    'ت': 'T',
    'ث': 'T', // OR 'TH'
    'ج': 'J',
    'ح': 'H',
    'خ': 'K', // OR 'KH'
    'د': 'D',
    'ذ': 'Z', // OR 'DH'
    'ر': 'R',
    'ز': 'Z',
    'س': 'S',
    'ش': 'S', // OR 'SH'
    'ص': 'S',
    'ض': 'D',
    'ط': 'T',
    'ظ': 'Z',
    'ع': 'A',
    'غ': 'G', // OR 'GH'
    'ف': 'F',
    'ق': 'Q',
    'ك': 'K',
    'ل': 'L',
    'م': 'M',
    'ن': 'N',
    'ه': 'H',
    'و': 'W',
    'ي': 'Y', 'ى': 'Y'
};

export const transliterate = (text: string): string => {
    if (!text) return 'X';
    const firstChar = text.trim().charAt(0);
    return arabicToEnglishMap[firstChar] || (/[a-zA-Z]/.test(firstChar) ? firstChar.toUpperCase() : 'X');
};
