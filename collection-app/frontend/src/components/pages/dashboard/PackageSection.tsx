import { Package } from "@/types/package";

type PackageSectionProps = {
  title: string;
  packages: Package[];
  showDelayReason?: boolean;
};

const PackageSection = ({
  title,
  packages,
  showDelayReason = false,
}: PackageSectionProps) => {
  console.log(packages);
  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>

      {packages.length === 0 ? (
        <p>No packages found</p>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => (
            <div key={pkg.trackingId} className="rounded border p-4">
              <p>
                <strong>Sender:</strong> {pkg.senderName}
              </p>

              <p>
                <strong>Receiver:</strong> {pkg.receiverName}
              </p>

              <p>
                <strong>Region:</strong> {pkg.region.name}
              </p>

              <p>
                <strong>Status:</strong> {pkg.status}
              </p>

              {showDelayReason && (
                <p>
                  <strong>Delay Reason:</strong> {pkg.delayReason ?? "N/A"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PackageSection;
