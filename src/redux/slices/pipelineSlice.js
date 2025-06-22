import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  milestones: [],
  projectCount: 0,
};

const pipelineSlice = createSlice({
  name: 'pipeline',
  initialState,
  reducers: {
    setPipelineData: (state, action) => {
      state.milestones = action.payload.milestones;
      state.projectCount = action.payload.projectCount;
    },
    clearPipelineData: (state) => {
      state.milestones = [];
      state.projectCount = 0;
    },
  },
});

export const { setPipelineData, clearPipelineData } = pipelineSlice.actions;
export default pipelineSlice.reducer;
