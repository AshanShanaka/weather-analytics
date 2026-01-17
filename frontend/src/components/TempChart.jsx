import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function TempChart({ cityName, points }) {
    const labels = points.map(p => p.time);
    const temps = points.map(p => p.tempC);

    return (
        <Line
            data={{
                labels,
                datasets: [
                    {
                        label: `${cityName} Temperature (°C)`,
                        data: temps
                    }
                ]
            }}
        />
    );
}
