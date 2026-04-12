import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RecipeListItem from '@/components/RecipeListItem.vue';
import type { Recipe } from '@/api/types.js';

const recipe: Recipe = {
  id: 1,
  user_id: 1,
  title: 'Pasta',
  time_minutes: 15,
  difficulty: 'easy',
  servings: 2,
  calories_total: 500,
  protein_grams_total: 18,
  image_url: null,
  source_url: null,
  recipe_notes: null,
  favorite: true,
  price_tier: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ingredients: [],
  method_steps: [],
  utensils: [],
  user_notes: [],
};

describe('RecipeListItem', () => {
  it('renders title, time, and favorite indicator', () => {
    const wrapper = mount(RecipeListItem, { props: { recipe } });
    expect(wrapper.text()).toContain('Pasta');
    expect(wrapper.text()).toContain('15');
    expect(wrapper.find('.favorite').exists()).toBe(true);
  });

  it('emits open event on click', async () => {
    const wrapper = mount(RecipeListItem, { props: { recipe } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('open')).toBeTruthy();
    expect(wrapper.emitted('open')![0]).toEqual([1]);
  });
});
