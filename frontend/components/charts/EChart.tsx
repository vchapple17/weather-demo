import { useEffect, useRef } from 'react';
import { Dimensions, View, ViewStyle } from 'react-native';
import * as echarts from 'echarts';
import { SVGRenderer } from '@wuba/react-native-echarts';

echarts.use([SVGRenderer]);

const DEFAULT_WIDTH = Dimensions.get('window').width - 40;
const DEFAULT_HEIGHT = 240;

interface EChartProps {
  option: echarts.EChartsOption;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export function EChart({ option, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, style }: EChartProps) {
  const viewRef = useRef<any>(null);
  const chartRef = useRef<echarts.ECharts | undefined>(undefined);

  useEffect(() => {
    if (!viewRef.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(viewRef.current, 'light', {
        renderer: 'svg',
        width,
        height,
      });
    }

    chartRef.current.setOption(option, true);

    return () => {
      chartRef.current?.dispose();
      chartRef.current = undefined;
    };
  }, [option, width, height]);

  return <View ref={viewRef} style={[{ width, height }, style]} />;
}
