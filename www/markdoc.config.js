export default {
  tags: {
    Row: { render: 'Row' },
    Col: {
      render: 'Col',
      attributes: {
        sticky: { type: Boolean },
      },
    },
    CodeGroup: {
      render: 'CodeGroup',
      attributes: {
        title: { type: String },
        tag: { type: String },
        label: { type: String },
      },
    },
    Properties: { render: 'Properties' },
    Property: {
      render: 'Property',
      attributes: {
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    },
  },
};
