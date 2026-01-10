import "reflect-metadata";
import { ConsoleManager } from './console.manager';

describe('ConsoleManager', () => {
  let consoleManager: ConsoleManager;
  let stdoutWriteSpy: jest.SpyInstance;
  let consoleTableSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleManager = new ConsoleManager();
    // Spy on process.stdout.write to prevent actual output and verify calls
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    // Spy on console.table
    consoleTableSpy = jest.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('write', () => {
    it('should write message to stdout', () => {
      const message = 'Hello World';
      consoleManager.write(message);
      expect(stdoutWriteSpy).toHaveBeenCalledWith(message);
    });
  });

  describe('writeLine', () => {
    it('should write message with newline to stdout', () => {
      const message = 'Hello World';
      consoleManager.writeLine(message);
      expect(stdoutWriteSpy).toHaveBeenCalledWith(message + '\n');
    });
  });

  describe('writeTable', () => {
    it('should call console.table', () => {
      const table = [{ id: 1, name: 'Test' }];
      consoleManager.writeTable(table);
      expect(consoleTableSpy).toHaveBeenCalledWith(table);
    });
  });

  describe('Formatted logs', () => {
    it('writeError should write red text with prefix', () => {
      consoleManager.writeError('Something went wrong');
      // Just check that it calls writeLine (via stdout) with some expected substrings
      // Since we didn't spy on writeLine but on process.stdout.write, we check args
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));
      // Check for ANSI red code (31m)
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('\x1b[31m'));
    });

    it('writeSuccess should write green text with prefix', () => {
      consoleManager.writeSuccess('Good job');
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Success:'));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Good job'));
      // Check for ANSI green code (32m)
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('\x1b[32m'));
    });

    it('writeWarning should write yellow text with prefix', () => {
      consoleManager.writeWarning('Watch out');
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Warning:'));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Watch out'));
      // Check for ANSI yellow code (33m)
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('\x1b[33m'));
    });

    it('writeInfo should write cyan text with prefix', () => {
      consoleManager.writeInfo('Just saying');
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Info:'));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Just saying'));
      // Check for ANSI cyan code (36m)
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('\x1b[36m'));
    });
  });

  describe('Spinner', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('startSpinner should start an interval and hide cursor', () => {
      consoleManager.startSpinner('Loading...');
      
      // Expect cursor hide code
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25l');
      
      // Fast-forward time to trigger interval
      jest.advanceTimersByTime(100);
      
      // Should have cleared line and written frame
      // We can't easily check order without complex mock implementations, 
      // but we can check if write was called with expected content
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Loading...'));
    });

    it('stopSpinner should clear interval and show cursor', () => {
      consoleManager.startSpinner('Loading...');
      consoleManager.stopSpinner('Done!', true);
      
      // Expect cursor show code
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25h');
      // Expect success message
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Done!'));
    });

    it('stopSpinner should write error if success is false', () => {
      consoleManager.startSpinner('Loading...');
      consoleManager.stopSpinner('Failed!', false);
      
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Failed!'));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));
    });
  });

  describe('ProgressBar', () => {
    it('should draw a progress bar', () => {
      consoleManager.updateProgressBar(50, 100, 'Halfway');
      
      // 50% of 30 chars = 15 chars
      // We expect 15 solid blocks and 15 empty blocks
      const solid = '█'.repeat(15);
      const empty = '░'.repeat(15);
      
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining(`[${solid}${empty}]`));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('50%'));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Halfway'));
    });

    it('should write a newline when complete', () => {
      consoleManager.updateProgressBar(100, 100, 'Done');
      // Should write empty string with newline (writeLine('')) which becomes '\n'
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\n');
    });
  });
});