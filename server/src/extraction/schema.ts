export const SAVE_RECIPE_TOOL = {
  name: 'save_recipe',
  description: 'Return a structured recipe extracted from the provided text.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      time_minutes: { type: 'integer', minimum: 0 },
      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
      servings: { type: 'integer', minimum: 1 },
      calories_total: { type: ['integer', 'null'] },
      protein_grams_total: { type: ['integer', 'null'] },
      image_url: { type: ['string', 'null'] },
      recipe_notes: { type: ['string', 'null'] },
      price_tier: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        description: '1 = cheapest ingredients, 5 = most expensive',
      },
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            position: { type: 'integer', minimum: 0 },
            quantity: { type: ['string', 'null'] },
            unit: { type: ['string', 'null'] },
            name: { type: 'string' },
            note: { type: ['string', 'null'] },
          },
          required: ['position', 'quantity', 'unit', 'name', 'note'],
        },
      },
      method_steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            position: { type: 'integer', minimum: 0 },
            text: { type: 'string' },
          },
          required: ['position', 'text'],
        },
      },
      utensils: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
    },
    required: [
      'title',
      'time_minutes',
      'difficulty',
      'servings',
      'calories_total',
      'protein_grams_total',
      'image_url',
      'recipe_notes',
      'price_tier',
      'ingredients',
      'method_steps',
      'utensils',
    ],
  },
} as const;
