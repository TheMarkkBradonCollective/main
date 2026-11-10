#!/usr/bin/env node
/**
 * Make a PBKDF2-SHA256 hash for an MBC Store admin (FOUNDER_PASSWORD_HASH or an ADMINS_JSON entry).
 * Reads the password from stdin so it never lands in shell history:
 *   node scripts/hash-admin-password.mjs < password.txt
 * Store the output as an encrypted Pages secret. Never commit it alongside the password.
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto';
const ITER = 100000; // Cloudflare Workers' Web Crypto max for PBKDF2
const chunks = [];
for await (const c of process.stdin) chunks.push(c);
const pw = Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
if (!pw) { console.error('No password on stdin'); process.exit(1); }
const salt = randomBytes(16);
const hash = pbkdf2Sync(pw, salt, ITER, 32, 'sha256');
console.log(`pbkdf2-sha256$${ITER}$${salt.toString('base64')}$${hash.toString('base64')}`);
