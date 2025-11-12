/**
 * Copyright (c) 2020-2022 Kenneth Tran and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
 * Licensed under MIT (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/blob/3.X.X-Branch/LICENSE)
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CacheMap } from '../typings/Global';
import { resetAll } from './SharedActions';

const initialState: CacheMap = {};

const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    addCache: (
      state,
      action: PayloadAction<{ key: string; value: unknown }>,
    ) => {
      const newCacheObject = {
        ...state,
      };
      newCacheObject[`${action.payload.key}`] = action.payload.value;
      return newCacheObject;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(resetAll, () => initialState)
      .addDefaultCase((state) => state);
  },
});

export const { addCache } = cacheSlice.actions;
export const selectCache = cacheSlice.selectSlice;

export default cacheSlice.reducer;
