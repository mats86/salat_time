/** Stitch design reference images for demo mosques */
export const MOSQUE_IMAGES: Record<string, string> = {
  default:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBwNgBHvV2D4J-NAQn-o-q8QdN_zAO8hFJeGI3PpvjZfXhFnnNfHZUFPP6-qRjXH_K_hD6NuyoVSfltUQnPDThbyttzhkuQXbXuPmloS6BsQnT9g9HRJgA22t7JObCwYVJEs8NtZhOUtJcjzB02ZEdp1sWiFlO3Rn011i5wXDUZwHg-OFRPw91FB7-qctfODrDU4IETSvvmy6We4DM3rFf53IdEEx0MqYTcK4TimlRa2fiR96jz75qngEfTEbnLRMBpDW_jMqDH61j8',
  'Al-Noor Mosque':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBwNgBHvV2D4J-NAQn-o-q8QdN_zAO8hFJeGI3PpvjZfXhFnnNfHZUFPP6-qRjXH_K_hD6NuyoVSfltUQnPDThbyttzhkuQXbXuPmloS6BsQnT9g9HRJgA22t7JObCwYVJEs8NtZhOUtJcjzB02ZEdp1sWiFlO3Rn011i5wXDUZwHg-OFRPw91FB7-qctfODrDU4IETSvvmy6We4DM3rFf53IdEEx0MqYTcK4TimlRa2fiR96jz75qngEfTEbnLRMBpDW_jMqDH61j8',
  'Berlin Central Mosque':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDXeIrn__scDVwuMvOTPQrBfCmpFqvvL2atKdbcNyXihnCZzXxP5IbKqBtKuPIIdT7TjeeFMixyrU8PlEByXsdIKA4YAIQsn9-fphqwY8-2Az8ccRG6R9Wq048eJB58ie6KbIQsGg-fSawvTv3p13-UocT0h3qnxV-s6Wk41-MEs4rgWCvgEpASY7a2QS08xwpBSh797hTVWH4EWeArK1reG_-8TELjWlbBKFOv0MZj5FFhheX3-vI6_5CpY6ftdkY-tTgzZp6-WvuE',
};

export function getMosqueImage(name: string): string {
  return MOSQUE_IMAGES[name] ?? MOSQUE_IMAGES.default;
}
