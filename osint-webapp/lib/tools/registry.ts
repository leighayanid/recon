/**
 * Tool Registry
 * Central registry for all OSINT tool executors
 */

import type { ToolExecutor } from './base/ToolExecutor';
import type { ToolName } from '@/lib/queue/types';
import { SherlockExecutor } from './sherlock/SherlockExecutor';

// Registry map
const toolRegistry = new Map<ToolName, ToolExecutor>();

/**
 * Initialize and register all tool executors
 */
export function initializeRegistry(): void {
  if (toolRegistry.size > 0) {
    return; // Already initialized
  }

  // Register tools
  registerTool('sherlock', new SherlockExecutor());

  // TODO: Register additional tools as they are implemented
  // registerTool('maigret', new MaigretExecutor());
  // registerTool('theharvester', new TheHarvesterExecutor());
  // registerTool('sublist3r', new Sublist3rExecutor());
  // registerTool('holehe', new HoleheExecutor());
  // registerTool('phoneinfoga', new PhoneInfogaExecutor());
  // registerTool('exiftool', new ExifToolExecutor());

  console.log(`Tool registry initialized with ${toolRegistry.size} tools`);
}

/**
 * Register a tool executor
 */
export function registerTool(name: ToolName, executor: ToolExecutor): void {
  if (toolRegistry.has(name)) {
    console.warn(`Tool ${name} is already registered. Overwriting.`);
  }
  toolRegistry.set(name, executor);
  console.log(`Registered tool: ${name}`);
}

/**
 * Get a tool executor by name
 */
export function getToolExecutor(name: ToolName): ToolExecutor | undefined {
  if (toolRegistry.size === 0) {
    initializeRegistry();
  }
  return toolRegistry.get(name);
}

/**
 * Get all registered tools
 */
export function getAllTools(): Map<ToolName, ToolExecutor> {
  if (toolRegistry.size === 0) {
    initializeRegistry();
  }
  return new Map(toolRegistry);
}

/**
 * Get tool metadata for all registered tools
 */
export function getAllToolsMetadata() {
  if (toolRegistry.size === 0) {
    initializeRegistry();
  }

  const metadata: Record<string, any> = {};
  toolRegistry.forEach((executor, name) => {
    metadata[name] = executor.getMetadata();
  });

  return metadata;
}

/**
 * Check if a tool is registered
 */
export function isToolRegistered(name: ToolName): boolean {
  if (toolRegistry.size === 0) {
    initializeRegistry();
  }
  return toolRegistry.has(name);
}

/**
 * Unregister a tool
 */
export function unregisterTool(name: ToolName): boolean {
  return toolRegistry.delete(name);
}

/**
 * Clear all registered tools
 */
export function clearRegistry(): void {
  toolRegistry.clear();
}

/**
 * Get tools by category
 */
export function getToolsByCategory(
  category: 'username' | 'domain' | 'email' | 'phone' | 'image' | 'social'
): Map<ToolName, ToolExecutor> {
  if (toolRegistry.size === 0) {
    initializeRegistry();
  }

  const filtered = new Map<ToolName, ToolExecutor>();
  toolRegistry.forEach((executor, name) => {
    if (executor.getMetadata().category === category) {
      filtered.set(name, executor);
    }
  });

  return filtered;
}

// Initialize registry on module load
initializeRegistry();
