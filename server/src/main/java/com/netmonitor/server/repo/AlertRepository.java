package com.netmonitor.server.repo;

import com.netmonitor.server.model.Alert;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findTop100ByOrderByTimestampDesc();
    List<Alert> findByAcknowledgedFalseOrderByTimestampDesc();
}

