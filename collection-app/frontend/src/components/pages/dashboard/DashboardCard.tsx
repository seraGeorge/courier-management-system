type DashboardCardProps = {
  title: string;
  count: number;
};

const DashboardCard = ({ title, count }: DashboardCardProps) => {
  return (
    <div className="rounded-lg border p-6 shadow">
      <h2 className="text-lg font-medium">{title}</h2>

      <p className="mt-4 text-4xl font-bold">{count}</p>
    </div>
  );
};

export default DashboardCard;
