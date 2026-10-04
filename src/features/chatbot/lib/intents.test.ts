import { describe, expect, it } from 'vitest';
import { getChatbotReply } from './intents';

describe('getChatbotReply', () => {
  it('greets using the provided name', () => {
    expect(getChatbotReply('Hola', { userName: 'Ana' }).text).toContain('Ana');
  });

  it('suggests navigating to routines', () => {
    const reply = getChatbotReply('quiero ver mis rutinas');
    expect(reply.action?.path).toBe('/rutinas');
  });

  it('suggests creating a routine', () => {
    const reply = getChatbotReply('quiero crear una nueva actividad');
    expect(reply.action?.path).toBe('/rutinas/nueva');
  });

  it('explains points without an action', () => {
    const reply = getChatbotReply('cuantas estrellas llevo');
    expect(reply.action).toBeUndefined();
    expect(reply.text.toLowerCase()).toContain('estrellas');
  });

  it('falls back to a default reply for unknown input', () => {
    expect(getChatbotReply('asdkjaslkdj').action).toBeUndefined();
  });

  it('is accent-insensitive', () => {
    expect(getChatbotReply('como funciona').text).toContain('rutinas');
  });
});
