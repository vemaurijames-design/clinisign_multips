package com.clinisign.config;

import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.clinisign.tenant.repository",
        entityManagerFactoryRef = "tenantEntityManagerFactory",
        transactionManagerRef = "tenantTransactionManager"
)
@Slf4j
public class TenantDataSourceConfig {

    @Bean
    public RoutingDataSource routingDataSource(
            @Qualifier("masterDataSource") DataSource masterDataSource,
            IpsRepository ipsRepository,
            DataSourceManager dataSourceManager) {
        RoutingDataSource rds = new RoutingDataSource();
        rds.setDefaultTargetDataSource(masterDataSource);
        Map<Object, Object> targetDataSources = new HashMap<>();
        try {
            List<Ips> ipsActivas = ipsRepository.findByActivoTrue();
            for (Ips ips : ipsActivas) {
                try {
                    DataSource ds = dataSourceManager.createDataSourceForIps(ips);
                    dataSourceManager.registerExisting(ips.getId(), ds);
                    targetDataSources.put(ips.getId(), ds);
                    rds.addDataSource(ips.getId(), ds);
                    log.info("BD cargada al arranque: {} (IPS {})", ips.getBdNombre(), ips.getId());
                } catch (Exception e) {
                    log.error("No se pudo cargar BD de IPS {}: {}", ips.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Aún no hay IPS o la BD maestra no está lista: {}", e.getMessage());
        }
        rds.setTargetDataSources(targetDataSources);
        rds.afterPropertiesSet();
        return rds;
    }

    @Bean(name = "tenantEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean tenantEntityManagerFactory(
            @Qualifier("routingDataSource") RoutingDataSource routingDataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(routingDataSource);
        em.setPackagesToScan("com.clinisign.tenant.entity");
        em.setPersistenceUnitName("tenant");
        em.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        Map<String, Object> props = new HashMap<>();
        props.put("hibernate.hbm2ddl.auto", "none");
        props.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        props.put("hibernate.show_sql", "false");
        em.setJpaPropertyMap(props);
        return em;
    }

    @Bean(name = "tenantTransactionManager")
    public PlatformTransactionManager tenantTransactionManager(
            @Qualifier("tenantEntityManagerFactory") LocalContainerEntityManagerFactoryBean emf) {
        return new JpaTransactionManager(emf.getObject());
    }
}
