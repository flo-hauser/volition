import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import VizDots from 'src/components/VizDots.vue';

describe('VizDots', () => {
  it('renders 7 cells for 7-day week', () => {
    const wrapper = mount(VizDots, {
      props: {
        pattern: [0, 0, 0, 0, 0, 0, 0],
        todayIdx: 3,
      },
    });

    const cells = wrapper.findAll('.cell');
    expect(cells).toHaveLength(7);
  });

  it('displays day labels in empty cells', () => {
    const wrapper = mount(VizDots, {
      props: {
        pattern: [0, 0, 0, 0, 0, 0, 0],
        todayIdx: 3,
        dayLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      },
    });

    const cells = wrapper.findAll('.cell');
    expect(cells[0]!.text()).toBe('M');
    expect(cells[1]!.text()).toBe('T');
    expect(cells[6]!.text()).toBe('S');
  });

  it('displays checkmark in filled cells', () => {
    const wrapper = mount(VizDots, {
      props: {
        pattern: [1, 0, 1, 0, 0, 0, 0],
        todayIdx: 3,
      },
    });

    const cells = wrapper.findAll('.cell');
    expect(cells[0]!.find('svg').exists()).toBe(true);
    expect(cells[1]!.find('svg').exists()).toBe(false);
    expect(cells[2]!.find('svg').exists()).toBe(true);
  });

  it('applies filled class to checked cells', () => {
    const wrapper = mount(VizDots, {
      props: {
        pattern: [1, 0, 0, 0, 0, 0, 0],
        todayIdx: 3,
      },
    });

    const cells = wrapper.findAll('.cell');
    expect(cells[0]!.classes()).toContain('filled');
    expect(cells[1]!.classes()).not.toContain('filled');
  });

  it('applies today class to today cell', () => {
    const wrapper = mount(VizDots, {
      props: {
        pattern: [0, 0, 0, 0, 0, 0, 0],
        todayIdx: 3,
      },
    });

    const cells = wrapper.findAll('.cell');
    expect(cells[3]!.classes()).toContain('today');
    expect(cells[2]!.classes()).not.toContain('today');
  });

  it('applies future class to future cells', () => {
    const wrapper = mount(VizDots, {
      props: {
        pattern: [0, 0, 0, 0, 0, 0, 0],
        todayIdx: 3,
      },
    });

    const cells = wrapper.findAll('.cell');
    expect(cells[4]!.classes()).toContain('future');
    expect(cells[5]!.classes()).toContain('future');
    expect(cells[3]!.classes()).not.toContain('future');
  });

  it('disables future cells', () => {
    const wrapper = mount(VizDots, {
      props: {
        pattern: [0, 0, 0, 0, 0, 0, 0],
        todayIdx: 3,
      },
    });

    const cells = wrapper.findAll('.cell');
    expect(cells[3]!.attributes('disabled')).toBeUndefined();
    expect(cells[4]!.attributes('disabled')).toBeDefined();
    expect(cells[6]!.attributes('disabled')).toBeDefined();
  });

  describe('click handling', () => {
    it('does not call onCellClick when no callback provided', async () => {
      const wrapper = mount(VizDots, {
        props: {
          pattern: [0, 0, 0, 0, 0, 0, 0],
          todayIdx: 3,
        },
      });

      const cell = wrapper.findAll('.cell')[1]!;
      await cell.trigger('click');
      // Should not throw or error
    });

    it('calls onCellClick with correct index for past cells', async () => {
      const onCellClick = vi.fn();
      const wrapper = mount(VizDots, {
        props: {
          pattern: [0, 0, 0, 0, 0, 0, 0],
          todayIdx: 3,
          onCellClick,
        },
      });

      const cell = wrapper.findAll('.cell')[1]!;
      await cell.trigger('click');
      expect(onCellClick).toHaveBeenCalledWith(1);
    });

    it('calls onCellClick with correct index for today cell', async () => {
      const onCellClick = vi.fn();
      const wrapper = mount(VizDots, {
        props: {
          pattern: [0, 0, 0, 0, 0, 0, 0],
          todayIdx: 3,
          onCellClick,
        },
      });

      const cell = wrapper.findAll('.cell')[3]!;
      await cell.trigger('click');
      expect(onCellClick).toHaveBeenCalledWith(3);
    });

    it('does not call onCellClick for future cells', async () => {
      const onCellClick = vi.fn();
      const wrapper = mount(VizDots, {
        props: {
          pattern: [0, 0, 0, 0, 0, 0, 0],
          todayIdx: 3,
          onCellClick,
        },
      });

      const cell = wrapper.findAll('.cell')[5]!;
      await cell.trigger('click');
      expect(onCellClick).not.toHaveBeenCalled();
    });

    it('applies clickable class to past and today cells when callback provided', () => {
      const onCellClick = vi.fn();
      const wrapper = mount(VizDots, {
        props: {
          pattern: [0, 0, 0, 0, 0, 0, 0],
          todayIdx: 3,
          onCellClick,
        },
      });

      const cells = wrapper.findAll('.cell');
      expect(cells[0]!.classes()).toContain('clickable');
      expect(cells[3]!.classes()).toContain('clickable');
      expect(cells[4]!.classes()).not.toContain('clickable');
    });

    it('does not apply clickable class when no callback provided', () => {
      const wrapper = mount(VizDots, {
        props: {
          pattern: [0, 0, 0, 0, 0, 0, 0],
          todayIdx: 3,
        },
      });

      const cells = wrapper.findAll('.cell');
      expect(cells[0]!.classes()).not.toContain('clickable');
    });
  });

  describe('pulse animation', () => {
    it('applies pulse class on click', async () => {
      const onCellClick = vi.fn();
      const wrapper = mount(VizDots, {
        props: {
          pattern: [0, 0, 0, 0, 0, 0, 0],
          todayIdx: 3,
          onCellClick,
        },
      });

      const cell = wrapper.findAll('.cell')[1]!;
      await cell.trigger('click');
      expect(cell.classes()).toContain('pulse');
    });

    it('removes pulse class after 700ms', async () => {
      vi.useFakeTimers();
      const onCellClick = vi.fn();
      const wrapper = mount(VizDots, {
        props: {
          pattern: [0, 0, 0, 0, 0, 0, 0],
          todayIdx: 3,
          onCellClick,
        },
      });

      const cell = wrapper.findAll('.cell')[1]!;
      await cell.trigger('click');
      expect(cell.classes()).toContain('pulse');

      vi.advanceTimersByTime(700);
      await wrapper.vm.$nextTick();

      expect(cell.classes()).not.toContain('pulse');
      vi.useRealTimers();
    });
  });
});
