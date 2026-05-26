package com.seo.reborn.member;

import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.List;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MemberRoleSchemaUpdater implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(MemberRoleSchemaUpdater.class);
	private static final String ROLE_CHECK_SQL = "role in ('NONE','PRESIDENT','TREASURER','WEB_ADMIN')";

	private final DataSource dataSource;
	private final JdbcTemplate jdbcTemplate;

	public MemberRoleSchemaUpdater(DataSource dataSource, JdbcTemplate jdbcTemplate) {
		this.dataSource = dataSource;
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void run(ApplicationArguments args) {
		updateRoleCheckConstraint();
	}

	public void updateRoleCheckConstraint() {
		try {
			if (!isPostgreSql() || !tableExists("members")) {
				return;
			}

			jdbcTemplate.execute("alter table members drop constraint if exists chk_members_role");

			List<String> roleCheckNames = jdbcTemplate.queryForList("""
				select c.conname
				from pg_constraint c
				join pg_class t on t.oid = c.conrelid
				join pg_namespace n on n.oid = t.relnamespace
				where t.relname = 'members'
				  and c.contype = 'c'
				  and pg_get_constraintdef(c.oid) like '%role%'
			""", String.class);

			for (String constraintName : roleCheckNames) {
				jdbcTemplate.execute("alter table members drop constraint if exists " + quoteIdentifier(constraintName));
			}

			jdbcTemplate.execute("alter table members add constraint chk_members_role check (" + ROLE_CHECK_SQL + ")");
		} catch (Exception exception) {
			log.warn("Failed to update members.role check constraint", exception);
		}
	}

	private boolean isPostgreSql() throws Exception {
		try (var connection = dataSource.getConnection()) {
			return connection.getMetaData().getDatabaseProductName().toLowerCase().contains("postgresql");
		}
	}

	private boolean tableExists(String tableName) throws Exception {
		try (var connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet resultSet = metaData.getTables(null, null, tableName, new String[] { "TABLE" })) {
				return resultSet.next();
			}
		}
	}

	private String quoteIdentifier(String value) {
		return "\"" + value.replace("\"", "\"\"") + "\"";
	}
}
