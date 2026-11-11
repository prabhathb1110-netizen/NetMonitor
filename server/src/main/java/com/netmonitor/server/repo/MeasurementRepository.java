package com.netmonitor.server.repo;

import com.netmonitor.server.model.Measurement;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MeasurementRepository extends JpaRepository<Measurement, Long> {

    List<Measurement> findByDeviceIdAndCheckedAtAfterOrderByCheckedAtAsc(Long deviceId, Instant after);

    long deleteByDeviceId(Long deviceId);

    long deleteByCheckedAtBefore(Instant cutoff);
}
